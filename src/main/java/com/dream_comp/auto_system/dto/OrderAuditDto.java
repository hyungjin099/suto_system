package com.dream_comp.auto_system.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OrderAuditDto {
    private Long auditNum;
    private Long orderNum;
    private Long itemNum;
    private String action;       // CREATE / UPDATE / DELETE / STATUS_CHANGE / WORKFLOW_CHANGE
    private String actor;        // 관리자 username 또는 'CUSTOMER'
    private String beforeJson;
    private String afterJson;
    private String memo;
    private LocalDateTime at;
}
