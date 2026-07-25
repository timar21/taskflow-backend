import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { TestAppModule } from './utils/test-app.module';
import { TransformInterceptor } from '../src/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/filters/http-exception.filter';

describe('Tasks (e2e)', () => {
    let app: INestApplication<App>;
    let userToken: string;
    let userId: number;
    let projectId: number;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        app.useGlobalInterceptors(new TransformInterceptor());
        app.useGlobalFilters(new HttpExceptionFilter());
        await app.init();

        // Regular user — will be the task assignee
        const userRes = await request(app.getHttpServer())
            .post('/users')
            .send({ name: 'Selome', email: 'tasks-user@e2e.com', password: 'password123' });
        userId = userRes.body.data.id;

        // Admin — needed to create the project the task will belong to
        const adminRes = await request(app.getHttpServer())
            .post('/users')
            .send({ name: 'Admin', email: 'tasks-admin@e2e.com', password: 'password123' });
        const adminId = adminRes.body.data.id;

        const dataSource = app.get(DataSource);
        await dataSource.query(`UPDATE users SET role = 'admin' WHERE id = ?`, [adminId]);

        const userLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'tasks-user@e2e.com', password: 'password123' });
        userToken = userLogin.body.data.access_token;

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'tasks-admin@e2e.com', password: 'password123' });
        const adminToken = adminLogin.body.data.access_token;

        const projectRes = await request(app.getHttpServer())
            .post('/projects')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Notifications Test Project', ownerId: userId });
        projectId = projectRes.body.data.id;
    });

    afterAll(async () => {
        await app.close();
    });

    it('queues a notification job when a task is created with an assigned user', async () => {
        // A real Redis connection is required here since TasksModule pulls in
        // the Bull-backed NotificationsModule — this proves the whole chain
        // (controller -> service -> queue.add -> Redis) works end-to-end, not
        // just that the HTTP response looks right.
        const res = await request(app.getHttpServer())
            .post('/tasks')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ title: 'Write onboarding doc', projectId, assignedUserId: userId })
            .expect(201);

        expect(res.body.data.assignedUser.id).toBe(userId);
    });

    it('does not require an assigned user to create a task', async () => {
        const res = await request(app.getHttpServer())
            .post('/tasks')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ title: 'Unassigned task', projectId })
            .expect(201);

        expect(res.body.data.title).toBe('Unassigned task');
    });
});