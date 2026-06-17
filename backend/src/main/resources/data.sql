-- Initialize user roles
INSERT INTO user_roles (role_name, role_description) VALUES ('student', 'Student User') ON CONFLICT DO NOTHING;
INSERT INTO user_roles (role_name, role_description) VALUES ('school', 'School User') ON CONFLICT DO NOTHING;
INSERT INTO user_roles (role_name, role_description) VALUES ('company', 'Company User') ON CONFLICT DO NOTHING;
INSERT INTO user_roles (role_name, role_description) VALUES ('admin', 'Admin User') ON CONFLICT DO NOTHING;

-- Initialize test users (password is MD5 of: 123456)
INSERT INTO users (username, password, email, real_name, role_id, status) 
SELECT 'student1', 'e10adc3949ba59abbe56e057f20f883e', 'student@test.com', 'Test Student', id, 1 
FROM user_roles WHERE role_name = 'student'
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password, email, real_name, role_id, status) 
SELECT 'company1', 'e10adc3949ba59abbe56e057f20f883e', 'company@test.com', 'Test Company', id, 1 
FROM user_roles WHERE role_name = 'company'
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password, email, real_name, role_id, status) 
SELECT 'admin', 'e10adc3949ba59abbe56e057f20f883e', 'admin@test.com', 'Admin', id, 1 
FROM user_roles WHERE role_name = 'admin'
ON CONFLICT (username) DO NOTHING;
