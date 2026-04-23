package com.dativus.server.service;

import com.dativus.server.dto.UserRegisterRequest;
import com.dativus.server.entity.User;
import com.dativus.server.entity.Workspace;
import com.dativus.server.repository.UserRepository;
import com.dativus.server.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;

    @Transactional
    public String register(UserRegisterRequest request) {
        // 1. 비밀번호 일치 확인
        if (!request.getPassword().equals(request.getPasswordCheck())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }

        // 2. 이메일 중복 검사
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("이미 사용 중인 이메일입니다.");
        }

        // 3. 워크스페이스(팀 공간) 생성
        String workspaceName = request.getUsername() + "의 워크스페이스";
        Workspace workspace = new Workspace(workspaceName);
        workspaceRepository.save(workspace);
        
        // 4. 사용자 생성 (설계서 v2.0의 password_hash 반영)
        // 보안을 위해 실제로는 암호화가 필요하지만, 우선 로직 확인을 위해 평문으로 저장합니다.
        User user = new User(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                workspace
        );
        userRepository.save(user);

        return "회원가입 성공! (User ID: " + user.getId() + ")";
    }
}