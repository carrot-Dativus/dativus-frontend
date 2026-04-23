package com.dativus.server.service;

import com.dativus.server.dto.LoginRequest;
import com.dativus.server.dto.LoginResponse;
import com.dativus.server.entity.User;
import com.dativus.server.repository.UserRepository;
import com.dativus.server.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    

    public LoginResponse login(LoginRequest request) {
        System.out.println("입력된 이메일: " + request.getEmail());
        // 1. 이메일로 유저 찾기
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("가입되지 않은 이메일입니다."));

        // 2. 비밀번호 확인 (현재는 평문 비교, 추후 암호화 적용)
        if (!user.getPasswordHash().equals(request.getPassword())) {
            throw new RuntimeException("비밀번호가 틀렸습니다.");
        }

        // 3. JWT 토큰 생성
        String token = jwtUtil.generateToken(user.getId().toString(), user.getWorkspace().getId().toString());

        // 4. 명세서에 맞게 응답 객체 만들어서 돌려주기
        return new LoginResponse(
                token,
                "Bearer",
                user.getId().toString(),
                user.getWorkspace().getId().toString()
        );
    }
}