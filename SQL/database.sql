CREATE DATABASE IF NOT EXISTS sistema_registrazione;
USE sistema_registrazione;

CREATE TABLE if NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,    
    username VARCHAR(50) NOT NULL UNIQUE,  
    email VARCHAR(100) NOT NULL UNIQUE,        
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);