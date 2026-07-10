# Raycast 工具箱插件

实现一个工具箱插件，提供开发者常用功能

## 整体架构

每个功能都有独立命令，进入插件后可以展示所有功能列表，可以动态搜索

## 初步功能

### json查看器

- 用户输入字符串，转换后展示，提供复制功能
- 默认获取剪贴板内容，如果为空或非json字符串则回退至用户手动输入

### mybatis日志格式化

- 用户输入程序中的mybatis日志，格式化为可执行的完整sql展示，提供复制功能
- 默认获取剪贴板内容，如果为空或非json字符串则回退至用户手动输入
- 日志核心内容最少包含如下两行，`==>`前的内容不尽相同，兼容多种输入情况
```
2026-07-10 15:29:49.192 [xxl-job, JobThread-63-1783668549042] [c.k.t.d.m.T.selectOrgaAndStaffBySuperOrgaCodeAndName:135] DEBUG ==>  Preparing: SELECT t1.ORGA_ID, t1.ORGA_NAME, t1.ORGA_OUT_COMPANY, t2.STAFF_ID, t2.STAFF_NAME FROM ykf_ics.t_sam_orga_info t1 LEFT JOIN ykf_ics.t_sam_staff_info t2 ON t1.ORGA_ID = t2.ORGA_ID WHERE t1.SUPER_ORGA_CODE in (select ORGA_ID from ykf_ics.t_sam_orga_info where SUPER_ORGA_CODE = ?) AND t1.ORGA_NAME like concat('%', ?, '%') LIMIT 1
2026-07-10 15:29:49.193 [xxl-job, JobThread-63-1783668549042] [c.k.t.d.m.T.selectOrgaAndStaffBySuperOrgaCodeAndName:135] DEBUG ==> Parameters: 101(String), 公众交付团队(String)
```