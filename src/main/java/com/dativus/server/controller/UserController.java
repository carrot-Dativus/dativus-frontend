package com.dativus.server.controller;

import com.dativus.server.dto.UserRegisterRequest;
import com.dativus.server.service.UserService;
import lombok.RequiredArgsConstructor;
// import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import org.springframework.ui.Model;

//@RestController
@Controller
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /* 
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserRegisterRequest request) {
        try {
            String message = userService.register(request);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    */

    // html 사용방식으로 수정

    // GET: 브라우저 주소창에 주소를 입력했을 때 화면을 띄워줌
    @GetMapping("/register")
    public String registerForm() {
        return "register"; // templates 폴더의 register.html을 렌더링
    }

    // POST: 폼에서 '가입하기' 버튼을 눌렀을 때 실행됨
    @PostMapping("/register")
    public String register(@ModelAttribute UserRegisterRequest request, Model model) {
        // @RequestBody(JSON 전용) -> @ModelAttribute(HTML Form 전용)으로 변경
        try {
            // 기존 코드의 서비스 호출 로직 그대로 유지!
            String message = userService.register(request); 
            
            // 성공 메시지를 화면에 전달하고 로그인 페이지(혹은 홈)로 보낼 준비
            model.addAttribute("successMsg", "가입 성공: " + message);
            return "register"; // 테스트를 위해 일단 동일한 가입 화면을 띄움
            
        } catch (RuntimeException e) {
            // 실패 시 기존처럼 에러 메시지를 가져와 화면에 전달
            model.addAttribute("errorMsg", "가입 실패: " + e.getMessage());
            return "register"; // 다시 가입 화면을 띄워줌
        }
    }
    
}