package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.PopupDto;
import com.dream_comp.auto_system.dto.PopupPublicDto;
import com.dream_comp.auto_system.dto.PopupRequestDto;
import com.dream_comp.auto_system.service.PopupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PopupController {

    private final PopupService popupService;

    /** 고객 주문 페이지용 — 지금 노출할 팝업 1건 (없으면 204). 인증 불필요 */
    @GetMapping("/api/clients/{cliCode}/popup")
    public ResponseEntity<PopupPublicDto> active(@PathVariable String cliCode) {
        PopupPublicDto p = popupService.findActiveFor(cliCode);
        return p == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(p);
    }

    // ── 관리자 (AdminAuthInterceptor 로 보호) ──────────────────
    @GetMapping("/api/admin/popups")
    public ResponseEntity<List<PopupDto>> getAll() {
        return ResponseEntity.ok(popupService.findAll());
    }

    @PostMapping("/api/admin/popups")
    public ResponseEntity<PopupDto> create(@Valid @RequestBody PopupRequestDto req) {
        return ResponseEntity.ok(popupService.create(req));
    }

    @PutMapping("/api/admin/popups/{popupNum}")
    public ResponseEntity<PopupDto> update(@PathVariable Long popupNum,
                                           @Valid @RequestBody PopupRequestDto req) {
        return ResponseEntity.ok(popupService.update(popupNum, req));
    }

    @PatchMapping("/api/admin/popups/{popupNum}/use")
    public ResponseEntity<PopupDto> setUse(@PathVariable Long popupNum,
                                           @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(popupService.setUse(
                popupNum, Boolean.TRUE.equals(body.get("use")), Boolean.TRUE.equals(body.get("replace"))));
    }

    @DeleteMapping("/api/admin/popups/{popupNum}")
    public ResponseEntity<Void> delete(@PathVariable Long popupNum) {
        popupService.delete(popupNum);
        return ResponseEntity.noContent().build();
    }
}
