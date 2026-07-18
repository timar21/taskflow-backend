import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { TestAppModule } from "./utils/test-app.module";
import { TransformInterceptor } from '../src/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/filters/http-exception.filter';

describe('Projects (e2e)', () => {
    let app: INestApplication<App>;

    let userToken: string;
    let userId: number;
    let adminToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, transform: true }),
        );
        app.useGlobalInterceptors(new TransformInterceptor());
        app.useGlobalFilters(new HttpExceptionFilter());
        await app.init();

        // Create a regular user
        const userRes = await request(app.getHttpServer())
            .post('/users')
            .send({ name: 'Selome', email: 'user@e2e.com', password: 'password123' });
        userId = userRes.body.data.id;

        // Create an admin user, then promote via a direct DB write — same idea
        // as the manual psql step in dev, since there's no API endpoint for it.
        const adminRes = await request(app.getHttpServer())
            .post('/users')
            .send({ name: 'Admin', email: 'admin@e2e.com', password: 'password123' });
        const adminId = adminRes.body.data.id;

        const dataSource = app.get(DataSource);
        await dataSource.query(`UPDATE users SET role = 'admin' WHERE id = ?`, [adminId]);

        // Log in both users through the real auth flow to get real tokens
        const userLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'user@e2e.com', password: 'password123' });
        userToken = userLogin.body.data.access_token;

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@e2e.com', password: 'password123' });
        adminToken = adminLogin.body.data.access_token;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Authentication', () => {
        it('rejects requests to /projects with no token', () => {
            return request(app.getHttpServer()).get('/projects').expect(401);
        });

        it('rejects requests with an invalid token', () => {
            return request(app.getHttpServer())
                .get('/projects')
                .set('Authorization', 'Bearer not-a-real-token')
                .expect(401);
        });

        it('allows requests with a valid token', () => {
            return request(app.getHttpServer())
                .get('/projects')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
        });
    });

    describe('Project CRUD', () => {
        let createdProjectId: number;

        it('forbids a regular user from creating a project', () => {
            return request(app.getHttpServer())
                .post('/projects')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'Should Fail' })
                .expect(403);
        });

        it('lets an admin create a project for a specific owner', async () => {
            const res = await request(app.getHttpServer())
                .post('/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'E2E Test Project', ownerId: userId })
                .expect(201);

            expect(res.body.data.name).toBe('E2E Test Project');
            createdProjectId = res.body.data.id;
        });

        it('lets the owner view their own project', () => {
            return request(app.getHttpServer())
                .get(`/projects/${createdProjectId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
        });

        it('lets the owner update their own project', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/projects/${createdProjectId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'Updated Name' })
                .expect(200);

            expect(res.body.data.name).toBe('Updated Name');
        });

        it('forbids a non-owner regular user from viewing the project', async () => {
            const otherRes = await request(app.getHttpServer())
                .post('/users')
                .send({ name: 'Other', email: 'other@e2e.com', password: 'password123' });
            const otherLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'other@e2e.com', password: 'password123' });
            const otherToken = otherLogin.body.data.access_token;

            return request(app.getHttpServer())
                .get(`/projects/${createdProjectId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .expect(403);
        });

        it('lets an admin view any project regardless of ownership', () => {
            return request(app.getHttpServer())
                .get(`/projects/${createdProjectId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('forbids a regular user from deleting a project', () => {
            return request(app.getHttpServer())
                .delete(`/projects/${createdProjectId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('lets an admin delete a project', () => {
            return request(app.getHttpServer())
                .delete(`/projects/${createdProjectId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('returns 404 for a project that no longer exists', () => {
            return request(app.getHttpServer())
                .get(`/projects/${createdProjectId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });
});