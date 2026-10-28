package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.controller.PopupConflictException;
import com.dream_comp.auto_system.dto.PopupDto;
import com.dream_comp.auto_system.dto.PopupPublicDto;
import com.dream_comp.auto_system.dto.PopupRequestDto;
import com.dream_comp.auto_system.mapper.PopupMapper;
import com.dream_comp.auto_system.vo.PopupVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PopupService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final PopupMapper popupMapper;

    public List<PopupDto> findAll() {
        return popupMapper.findAll();
    }

    /** 이 거래처에게 지금 보여줄 팝업 1건. 없으면 null */
    public PopupPublicDto findActiveFor(String cliCode) {
        return popupMapper.findActiveFor(cliCode, LocalDateTime.now(KST));
    }

    @Transactional
    public PopupDto create(PopupRequestDto req) {
        PopupVo vo = toVo(req);
        guardConflicts(null, vo.getUseYn().equals("Y"), vo.getStartAt(), vo.getEndAt(),
                req.getTargetAll(), req.getCliCodes(), req.getReplaceConflicts());
        popupMapper.insert(vo);
        saveTargets(vo.getPopupNum(), req);
        return popupMapper.findByPopupNum(vo.getPopupNum());
    }

    @Transactional
    public PopupDto update(Long popupNum, PopupRequestDto req) {
        if (popupMapper.findByPopupNum(popupNum) == null) {
            throw new IllegalArgumentException("존재하지 않는 팝업입니다");
        }
        PopupVo vo = toVo(req);
        vo.setPopupNum(popupNum);
        guardConflicts(popupNum, vo.getUseYn().equals("Y"), vo.getStartAt(), vo.getEndAt(),
                req.getTargetAll(), req.getCliCodes(), req.getReplaceConflicts());
        popupMapper.update(vo);
        saveTargets(popupNum, req);
        return popupMapper.findByPopupNum(popupNum);
    }

    @Transactional
    public PopupDto setUse(Long popupNum, boolean use, boolean replace) {
        PopupDto cur = popupMapper.findByPopupNum(popupNum);
        if (cur == null) {
            throw new IllegalArgumentException("존재하지 않는 팝업입니다");
        }
        guardConflicts(popupNum, use, cur.getStartAt(), cur.getEndAt(),
                "Y".equals(cur.getTargetAll()), cur.getCliCodes(), replace);
        popupMapper.updateUse(popupNum, use ? "Y" : "N");
        return popupMapper.findByPopupNum(popupNum);
    }

    public void delete(Long popupNum) {
        popupMapper.delete(popupNum);   // 대상 거래처는 FK ON DELETE CASCADE
    }

    /**
     * 사용 상태로 저장하려는 팝업이 사용 중인 다른 팝업과 기간·대상이 겹치면 막는다.
     * replace 가 true 면 겹치는 쪽을 사용 중지한다. 화면 검증만으로는 동시 작업을 못 막으므로 서버에서도 확인한다.
     */
    private void guardConflicts(Long selfNum, boolean use, LocalDateTime startAt, LocalDateTime endAt,
                                Boolean targetAll, List<String> cliCodes, Boolean replace) {
        if (!use) return;
        boolean all = !Boolean.FALSE.equals(targetAll);
        List<PopupDto> conflicts = popupMapper.findAll().stream()
                .filter(p -> !p.getPopupNum().equals(selfNum))
                .filter(p -> "Y".equals(p.getUseYn()))
                .filter(p -> !p.getStartAt().isAfter(endAt) && !startAt.isAfter(p.getEndAt()))
                .filter(p -> all || "Y".equals(p.getTargetAll())
                        || p.getCliCodes().stream().anyMatch(c -> cliCodes != null && cliCodes.contains(c)))
                .toList();
        if (conflicts.isEmpty()) return;
        if (Boolean.TRUE.equals(replace)) {
            conflicts.forEach(p -> popupMapper.updateUse(p.getPopupNum(), "N"));
            return;
        }
        throw new PopupConflictException(conflicts);
    }

    private PopupVo toVo(PopupRequestDto req) {
        if (!req.getEndAt().isAfter(req.getStartAt())) {
            throw new IllegalArgumentException("종료 일시는 시작 일시보다 늦어야 합니다");
        }
        boolean all = !Boolean.FALSE.equals(req.getTargetAll());
        if (!all && (req.getCliCodes() == null || req.getCliCodes().isEmpty())) {
            throw new IllegalArgumentException("대상 거래처를 1곳 이상 선택해 주세요");
        }
        PopupVo vo = new PopupVo();
        vo.setTitle(req.getTitle().trim());
        vo.setContent(req.getContent().trim());
        vo.setStartAt(req.getStartAt());
        vo.setEndAt(req.getEndAt());
        vo.setUseYn(Boolean.FALSE.equals(req.getUse()) ? "N" : "Y");
        vo.setTargetAll(all ? "Y" : "N");
        return vo;
    }

    private void saveTargets(Long popupNum, PopupRequestDto req) {
        popupMapper.deleteTargets(popupNum);
        if (Boolean.FALSE.equals(req.getTargetAll())) {
            List<String> codes = req.getCliCodes().stream().distinct().toList();
            popupMapper.insertTargets(popupNum, codes);
        }
    }
}
