-- Student Attendance Management System (SAMS) - Database Schema
-- Matches the ERD in Chapter 5 of the dissertation, plus supporting
-- authentication tables (sessions, password_resets) not shown on the
-- simplified academic diagram.

CREATE DATABASE IF NOT EXISTS sams CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sams;

-- ---------------------------------------------------------------
-- users: Admin, Lecturer, Student accounts
-- ---------------------------------------------------------------
CREATE TABLE users (
    user_id         INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(120)        NOT NULL,
    email           VARCHAR(190)        NOT NULL UNIQUE,
    password_hash   VARCHAR(255)        NOT NULL,
    role            ENUM('admin','lecturer','student') NOT NULL,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- courses: owned by a lecturer (1 lecturer : N courses)
-- ---------------------------------------------------------------
CREATE TABLE courses (
    course_id       INT AUTO_INCREMENT PRIMARY KEY,
    course_name     VARCHAR(150)        NOT NULL,
    course_code     VARCHAR(20)         NOT NULL UNIQUE,
    lecturer_id     INT                 NOT NULL,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturer_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- enrolments: junction table resolving Student <-> Course (M:N)
-- ---------------------------------------------------------------
CREATE TABLE enrolments (
    enrolment_id    INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT                 NOT NULL,
    course_id       INT                 NOT NULL,
    enrolled_at     DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_course (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- sessions: one row per class session for a course (needed to
-- record attendance against a specific date/time, FR03)
-- ---------------------------------------------------------------
CREATE TABLE class_sessions (
    session_id      INT AUTO_INCREMENT PRIMARY KEY,
    course_id       INT                 NOT NULL,
    session_date    DATE                NOT NULL,
    start_time      TIME                NOT NULL,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_course_session (course_id, session_date, start_time),
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- attendance_records: one row per student per session
-- ---------------------------------------------------------------
CREATE TABLE attendance_records (
    record_id       INT AUTO_INCREMENT PRIMARY KEY,
    enrolment_id    INT                 NOT NULL,
    session_id      INT                 NOT NULL,
    status          ENUM('present','absent','late') NOT NULL,
    recorded_at     DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_enrolment_session (enrolment_id, session_id),
    FOREIGN KEY (enrolment_id) REFERENCES enrolments(enrolment_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES class_sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- auth_sessions: server-side session store (Section 6.2.1)
-- ---------------------------------------------------------------
CREATE TABLE auth_sessions (
    token           CHAR(64)            PRIMARY KEY,
    user_id         INT                 NOT NULL,
    role            ENUM('admin','lecturer','student') NOT NULL,
    expires_at      DATETIME            NOT NULL,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- password_resets: FR07
-- ---------------------------------------------------------------
CREATE TABLE password_resets (
    reset_token     CHAR(64)            PRIMARY KEY,
    user_id         INT                 NOT NULL,
    expires_at      DATETIME            NOT NULL,
    used            TINYINT(1)          NOT NULL DEFAULT 0,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- notifications: FR05 low-attendance notifications
-- ---------------------------------------------------------------
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT                 NOT NULL,
    course_id       INT                 NOT NULL,
    message         VARCHAR(255)        NOT NULL,
    attendance_rate DECIMAL(5,2)        NOT NULL,
    is_read         TINYINT(1)          NOT NULL DEFAULT 0,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_session_date ON class_sessions(session_date);
CREATE INDEX idx_notifications_student ON notifications(student_id, is_read);
