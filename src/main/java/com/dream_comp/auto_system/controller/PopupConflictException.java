package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.PopupDto;
import lombok.Getter;

import java.util.List;

/** 사용 중인 다른 팝업과 기간·대상이 겹쳐 사용 상태로 둘 수 없을 때 */
@Getter
public class PopupConflictException extends RuntimeException {
    private final List<PopupDto> conflicts;

    public PopupConflictException(List<PopupDto> conflicts) {
        super("사용 중인 다른 팝업과 기간·대상이 겹칩니다");
        this.conflicts = conflicts;
    }
}
