package com.dream_comp.auto_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PopupRequestDto {

    @NotBlank(message = "제목을 입력해 주세요")
    @Size(max = 100, message = "제목은 100자 이내여야 합니다")
    private String title;

    @NotBlank(message = "내용을 입력해 주세요")
    @Size(max = 3000, message = "내용은 3000자 이내여야 합니다")
    private String content;

    @NotNull(message = "시작 일시를 입력해 주세요")
    private LocalDateTime startAt;

    @NotNull(message = "종료 일시를 입력해 주세요")
    private LocalDateTime endAt;

    private Boolean use = true;
    private Boolean targetAll = true;
    private List<String> cliCodes;

    /** true 면 충돌하는 다른 팝업을 사용 중지하고 이 팝업을 사용 상태로 저장 */
    private Boolean replaceConflicts = false;
}
