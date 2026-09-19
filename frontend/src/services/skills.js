import api from './api';

export const skillsService = {
  getAllSkills: async () => {
    const { data } = await api.get('/skills/');
    return data;
  },

  getSkill: async (skillId) => {
    const { data } = await api.get(`/skills/${skillId}`);
    return data;
  },

  createSkill: async (skillData) => {
    const { data } = await api.post('/skills/', skillData);
    return data;
  },

  updateSkill: async (skillId, skillData) => {
    const { data } = await api.put(`/skills/${skillId}`, skillData);
    return data;
  },

  deleteSkill: async (skillId) => {
    const { data } = await api.delete(`/skills/${skillId}`);
    return data;
  },

  getEmployeeSkills: async (employeeId) => {
    const url = employeeId ? `/employee-skills/?employee_id=${employeeId}` : '/employee-skills/';
    const { data } = await api.get(url);
    return data;
  },

  addEmployeeSkill: async (skillData) => {
    const { data } = await api.post('/employee-skills/', skillData);
    return data;
  },

  updateEmployeeSkill: async (employeeSkillId, skillData) => {
    const { data } = await api.put(`/employee-skills/${employeeSkillId}`, skillData);
    return data;
  },

  deleteEmployeeSkill: async (employeeSkillId) => {
    const { data } = await api.delete(`/employee-skills/${employeeSkillId}`);
    return data;
  },

  getTargetSkills: async (employeeId) => {
    const url = employeeId ? `/target-skills/?employee_id=${employeeId}` : '/target-skills/';
    const { data } = await api.get(url);
    return data;
  },

  addTargetSkill: async (targetData) => {
    const { data } = await api.post('/target-skills/', targetData);
    return data;
  },

  updateTargetSkill: async (targetSkillId, targetData) => {
    const { data } = await api.put(`/target-skills/${targetSkillId}`, targetData);
    return data;
  },

  deleteTargetSkill: async (targetSkillId) => {
    const { data } = await api.delete(`/target-skills/${targetSkillId}`);
    return data;
  },

  getSkillGaps: async (employeeId) => {
    const url = employeeId ? `/skill-gaps/?employee_id=${employeeId}` : '/skill-gaps/';
    const { data } = await api.get(url);
    return data;
  },

  getRecommendedCourses: async (skillId) => {
    const url = skillId ? `/courses/?skill_id=${skillId}` : '/courses/';
    const { data } = await api.get(url);
    return data;
  },

  validateSkill: async (employeeSkillId, validatedLevel, comment) => {
    const { data } = await api.post(`/employee-skills/${employeeSkillId}/validate`, {
      validated_level: validatedLevel,
      comment,
    });
    return data;
  },

  getPendingValidations: async () => {
    const { data } = await api.get('/employee-skills/pending-validations');
    return data;
  },

  getTeamSkills: async () => {
    const { data } = await api.get('/employee-skills/team');
    return data;
  },
};
