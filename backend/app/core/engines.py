"""
The maths of SkillSync. Every function here is plain Python with no database,
so it is easy to test. These are the mathematical engines for SkillSync.
"""
import math
from datetime import date
from typing import Optional, List, Dict, Tuple, Any

TAG_WEIGHT = {"Rising": 1.3, "Stable": 1.0, "Declining": 0.7}


def market_weight(demand_score: float) -> float:
    """Turns a 0-100 demand score into a weight between 0.5 and 1.5."""
    return 0.5 + float(demand_score) / 100.0


def gap(required: int, validated: Optional[int]) -> int:
    """Gap = required level - validated level. Positive means 'not there yet'."""
    return required - (validated or 0)


def calibration(self_level: Optional[int], validated: Optional[int]) -> Optional[int]:
    """self - validated. Positive = over-confident, negative = under-confident."""
    if self_level is None or validated is None:
        return None
    return self_level - validated


def role_readiness(rows: List[Dict[str, Any]]) -> int:
    """
    Sum(w * min(level/required, 1)) / Sum(w)   where w = importance * market weight.
    rows: dicts with level, required, importance, demand.
    """
    num = den = 0.0
    for r in rows:
        w = r["importance"] * market_weight(r.get("demand", 50))
        req = r.get("required", 1) or 1
        num += w * min((r.get("level") or 0) / req, 1)
        den += w
    return round(100 * num / den) if den else 0


def market_readiness(rows: List[Dict[str, Any]]) -> int:
    """
    Share of market-demanded skills held at level >= 3, weighted by demand score,
    minus 5 points for each held skill that is Declining (max 20).
    rows: dicts with level, demand, tag.
    """
    total = sum(r.get("demand", 50) for r in rows)
    if not total:
        return 0
    held = sum(r.get("demand", 50) for r in rows if (r.get("level") or 0) >= 3)
    penalty = min(20, 5 * sum(1 for r in rows if r.get("tag") == "Declining" and (r.get("level") or 0) >= 3))
    return max(0, round(100 * held / total - penalty))


def days_until(deadline: Optional[str], today: Optional[date] = None) -> Optional[int]:
    if not deadline:
        return None
    today = today or date.today()
    try:
        return (date.fromisoformat(deadline.split("T")[0]) - today).days
    except Exception:
        return None


def severity(gap_levels: int, tag: str, days_to_deadline: Optional[int]) -> float:
    """Gap size x market tag weight x deadline pressure."""
    if gap_levels <= 0:
        return 0.0
    if days_to_deadline is None:
        pressure = 1.0
    elif days_to_deadline <= 30:
        pressure = 1.5
    elif days_to_deadline <= 90:
        pressure = 1.2
    else:
        pressure = 1.0
    return round(gap_levels * TAG_WEIGHT.get(tag, 1.0) * pressure, 2)


def severity_label(score: float) -> str:
    if score >= 3:
        return "Critical"
    if score >= 1.5:
        return "High"
    return "Moderate" if score > 0 else "None"


def impact_per_hour(levels_closed: int, weight: float, importance: int, hours: float) -> float:
    """(levels closed x market weight x role relevance) / course hours."""
    relevance = importance / 5.0
    return round(levels_closed * weight * relevance / hours, 3) if hours else 0.0


def build_roadmap(items: List[Dict[str, Any]], weekly_hours: float = 6.0) -> List[Dict[str, Any]]:
    """Sort by impact-per-hour (best first) and lay out week by week."""
    ordered = sorted(items, key=lambda i: i.get("impact_per_hour", 0), reverse=True)
    used = 0.0
    for item in ordered:
        used += item.get("hours", 0)
        item["week"] = max(1, math.ceil(used / weekly_hours))
    return ordered


def next_tag(current: str, candidate: Optional[str], count: int, raw: str) -> Tuple[str, Optional[str], int]:
    """
    Hysteresis: a tag only changes after two refreshes in a row agree.
    Returns (tag, candidate, count).
    """
    if raw == current:
        return current, None, 0
    if raw == candidate:
        count += 1
        if count >= 2:
            return raw, None, 0
        return current, raw, count
    return current, raw, 1


def tag_from_growth(growth: float) -> str:
    if growth >= 0.10:
        return "Rising"
    if growth <= -0.10:
        return "Declining"
    return "Stable"


def demand_score(share: float, max_share: float, growth: float) -> float:
    """0-100 demand score calculation."""
    share_part = min(share / max_share, 1.0) * 100 if max_share else 0.0
    growth_part = max(0.0, min((growth + 0.5) / 1.0, 1.0)) * 100
    return round(0.7 * share_part + 0.3 * growth_part, 1)


def match_score(*, validated: int, available: bool, bandwidth: int, active_load: int,
                rating: float, mode: str, same_city: bool) -> Tuple[float, str]:
    """
    Match Me: skill level 40 + availability 20 + (location if in person,
    otherwise time flexibility) 15 + rating 15 + load balance 10.
    Returns the score and the human-readable reason.
    """
    left = max(bandwidth - active_load, 0)
    skill_pts = 40 * validated / 5
    avail_pts = 20 if (available and left > 0) else 0
    if mode == "in_person":
        third_pts, third_txt = (15, "same city") if same_city else (0, "different city")
    else:
        third_pts, third_txt = (15 if left > 0 else 0), "online, so location is ignored"
    rating_pts = 15 * rating / 5
    load_pts = 10 * max(0.0, 1 - active_load / bandwidth) if bandwidth else 0
    total = round(skill_pts + avail_pts + third_pts + rating_pts + load_pts, 1)
    reason = (f"Level {validated}/5 (+{skill_pts:.0f}), "
              f"{'available' if avail_pts else 'not available'} (+{avail_pts}), "
              f"{third_txt} (+{third_pts}), rating {rating:.1f} (+{rating_pts:.0f}), "
              f"{left} free slot(s) (+{load_pts:.0f})")
    return total, reason
