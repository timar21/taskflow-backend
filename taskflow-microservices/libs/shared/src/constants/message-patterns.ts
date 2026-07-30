// Every @MessagePattern()/@EventPattern() string used anywhere in the
// system, in one place. Before this, the exact same string literal (e.g.
// 'find_user_by_id') had to match exactly between the gateway's sendRpc
// call and the service's @MessagePattern decorator, with nothing but a
// typo to catch a mismatch — this makes that mismatch a compile error
// instead of a silent runtime failure.
export const UserMessagePatterns = {
    FIND_ALL_USERS: 'find_all_users',
    FIND_USER_BY_ID: 'find_user_by_id',
    CREATE_USER: 'create_user',
    UPDATE_USER: 'update_user',
    DELETE_USER: 'delete_user',
} as const;

export const AuthMessagePatterns = {
    LOGIN: 'auth_login',
    REFRESH: 'auth_refresh',
    LOGOUT: 'auth_logout',
} as const;

export const ProjectMessagePatterns = {
    FIND_ALL_PROJECTS: 'find_all_projects',
    FIND_PROJECT_BY_ID: 'find_project_by_id',
    CREATE_PROJECT: 'create_project',
    UPDATE_PROJECT: 'update_project',
    DELETE_PROJECT: 'delete_project',
} as const;

export const TaskMessagePatterns = {
    FIND_ALL_TASKS: 'find_all_tasks',
    FIND_TASK_BY_ID: 'find_task_by_id',
    GET_TASKS: 'get_tasks',
    CREATE_TASK: 'create_task',
    UPDATE_TASK: 'update_task',
    DELETE_TASK: 'delete_task',
} as const;

export const NotificationEventPatterns = {
    TASK_CREATED: 'task_created',
} as const;