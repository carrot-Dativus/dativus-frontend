package com.dativus.server.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserRegisterRequest {
    private String email;
    private String password;
    private String passwordCheck;
    private String username;
    private String workspaceName; // 회원가입 시 생성할 팀 이름
}