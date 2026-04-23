package com.dativus.server.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor; // 👈 1. 롬복 추가
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "workspaces")
@Getter
@NoArgsConstructor
@AllArgsConstructor // 👈 2. 어노테이션 추가
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // 👈 3. 서비스 코드 에러를 없애줄 진짜 핵심 생성자!
    public Workspace(String name) {
        this.name = name;
    }
}