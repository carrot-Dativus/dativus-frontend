package com.dativus.server.repository;

import com.dativus.server.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {
}