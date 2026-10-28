package com.dream_comp.auto_system.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PopupVo {
    private Long popupNum;
    private String title;
    private String content;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String useYn;      // 'Y' / 'N'
    private String targetAll;  // 'Y' / 'N'
}
