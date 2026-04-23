package com.dativus.server.controller;

import com.dativus.server.dto.LoginRequest;
import com.dativus.server.dto.LoginResponse;
// import com.dativus.server.dto.LoginResponse;
import com.dativus.server.service.AuthService;
import lombok.RequiredArgsConstructor;
// import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.ui.Model;

// @RestController
@Controller
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /* 
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // 에러가 나면 401(인증 실패) 상태 코드와 함께 메시지를 보냅니다. [cite: 160]
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
    */

    // html 기준으로 수정한 부분
    @GetMapping("/login")
    public String loginForm(Model model) {
    // 에러 메시지를 초기화하거나 아무것도 담지 않고 화면만 띄웁니다.
    model.addAttribute("error", null);
    return "login";
}

    @PostMapping("/login")
    public String login(@ModelAttribute LoginRequest request, Model model) {
        try {
            authService.login(request);
            return "redirect:/dashboard";
        } catch (RuntimeException e) {
            model.addAttribute("error", e.getMessage());
            return "login";
        }
    }

}