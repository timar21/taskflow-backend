export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Task {
    id: number;
    title: string;
    completed: boolean;
    assignedTo: number; // User id
}

export interface Project {
    id: number;
    name: string;
    description: string;
    tasks: Task[];
}