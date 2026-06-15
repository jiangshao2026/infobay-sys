
# 数据验证脚本 - 信佰监理服务管理系统
$ErrorActionPreference = "Continue"
$baseDir = "d:\Trae_space\信佰监理服务管理系统-0.3.2"
$dataDir = "$baseDir\src\data"
$reportFile = "$baseDir\_validation_report.txt"

# 需要验证的项目列表
$targetProjects = @("XB2005-0037","XB2005-0062","XB2005-0089","XB2005-0123","XB2005-0156","XB2005-0189","XB2005-0234","XB2005-0267","XB2005-0301","XB2005-0345")

Write-Host "=== 信佰监理服务管理系统 - 数据验证报告 ===" -ForegroundColor Cyan
Write-Host "验证时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# ============ 辅助函数 ============
function Extract-Field($content, $field) {
    # 匹配 field: 'value' 或 field: "value" 或 field: `value` 格式
    $pattern = "$field\s*[:=]\s*['`"`]([^'`"`n]+)['`"`]"
    $matches = [regex]::Matches($content, $pattern)
    $results = @()
    foreach ($m in $matches) {
        $results += $m.Groups[1].Value
    }
    return $results
}

function Extract-Field-Num($content, $field) {
    $pattern = "$field\s*[:=]\s*(\d+(?:\.\d+)?)"
    $matches = [regex]::Matches($content, $pattern)
    $results = @()
    foreach ($m in $matches) {
        $results += $m.Groups[1].Value
    }
    return $results
}

# 将每个数据对象分段（通过寻找 projectId 字段来定位对象块）
function Split-Objects($content) {
    # 通过大括号配对来分割对象
    $lines = $content -split "`r?`n"
    $objects = @()
    $current = New-Object System.Collections.ArrayList
    $depth = 0
    $inObject = $false
    
    foreach ($line in $lines) {
        $openBraces = ([regex]::Matches($line, "\{")).Count
        $closeBraces = ([regex]::Matches($line, "\}")).Count
        if ($openBraces -gt 0 -or $inObject) {
            $inObject = $true
            [void]$current.Add($line)
            $depth += $openBraces - $closeBraces
            if ($depth -le 0 -and $current.Count -gt 0) {
                $objects += ($current -join "`n")
                $current = New-Object System.Collections.ArrayList
                $inObject = $false
                $depth = 0
            }
        }
    }
    return $objects
}

# 从对象块中提取字段值
function Get-Field-Value($objText, $field) {
    $pattern = "(?ms)$field\s*[:]\s*['`"`]([^'`"`n]+)['`"`]"
    $m = [regex]::Match($objText, $pattern)
    if ($m.Success) { return $m.Groups[1].Value }
    # 数字字段
    $pattern2 = "(?ms)$field\s*[:]\s*(\d+(?:\.\d+)?)"
    $m2 = [regex]::Match($objText, $pattern2)
    if ($m2.Success) { return $m2.Groups[1].Value }
    return ""
}

# 从对象块中提取布尔值
function Get-Bool-Value($objText, $field) {
    $pattern = "(?ms)$field\s*[:]\s*(true|false)"
    $m = [regex]::Match($objText, $pattern)
    if ($m.Success) { return $m.Groups[1].Value }
    return ""
}

# 通过 projectId 统计每个项目的条目数
function Count-By-Project($filePath, $fieldName = "projectId") {
    if (-not (Test-Path $filePath)) { return @{} }
    $content = Get-Content $filePath -Raw -Encoding UTF8
    $pattern = "$fieldName\s*[:]\s*['`"`]([^'`"`n]+)['`"`]"
    $matches = [regex]::Matches($content, $pattern)
    $counts = @{}
    foreach ($m in $matches) {
        $pid = $m.Groups[1].Value
        if ($counts.ContainsKey($pid)) {
            $counts[$pid]++
        } else {
            $counts[$pid] = 1
        }
    }
    return $counts
}

# 获取文件中所有出现的 projectId
function Get-All-ProjectIds($filePath, $fieldName = "projectId") {
    if (-not (Test-Path $filePath)) { return @() }
    $content = Get-Content $filePath -Raw -Encoding UTF8
    $pattern = "$fieldName\s*[:]\s*['`"`]([^'`"`n]+)['`"`]"
    $matches = [regex]::Matches($content, $pattern)
    $ids = @()
    foreach ($m in $matches) {
        $ids += $m.Groups[1].Value
    }
    return $ids | Select-Object -Unique
}

# ============ 1. 解析 projects.ts ============
Write-Host "--- [1/7] 解析 projects.ts ---" -ForegroundColor Yellow
$projectsPath = "$dataDir\projects.ts"
$projectsContent = Get-Content $projectsPath -Raw -Encoding UTF8

# 尝试查找包含完整项目信息的对象块
# projects.ts 的导出变量通常为 projects 或 defaultProjects
# 我们用更简单的方法：按每个目标项目提取信息

$projectInfo = @{}
foreach ($pid in $targetProjects) {
    # 在文件中定位该项目的对象
    $pattern = "(?ms)projectCode\s*[:]\s*['`"`]$pid['`"`][^}]*\}"
    $m = [regex]::Match($projectsContent, $pattern)
    if (-not $m.Success) {
        # 尝试从后往前搜索
        $idx = $projectsContent.IndexOf($pid)
        if ($idx -gt 0) {
            # 向前找 {，向后找 }
            $startIdx = $projectsContent.LastIndexOf("{", $idx)
            $endIdx = $projectsContent.IndexOf("}", $idx)
            if ($startIdx -gt 0 -and $endIdx -gt $startIdx) {
                $objText = $projectsContent.Substring($startIdx, $endIdx - $startIdx + 1)
                $projectInfo[$pid] = @{
                    "name" = Get-Field-Value $objText "projectName|name"
                    "status" = Get-Field-Value $objText "status"
                    "approvalStatus" = Get-Field-Value $objText "approvalStatus"
                    "startDate" = Get-Field-Value $objText "startDate"
                    "endDate" = Get-Field-Value $objText "endDate"
                    "manager" = Get-Field-Value $objText "projectManager|manager"
                }
            }
        }
    } else {
        $objText = $m.Value
        $projectInfo[$pid] = @{
            "name" = Get-Field-Value $objText "projectName"
            "status" = Get-Field-Value $objText "status"
            "approvalStatus" = Get-Field-Value $objText "approvalStatus"
            "startDate" = Get-Field-Value $objText "startDate"
            "endDate" = Get-Field-Value $objText "endDate"
            "manager" = Get-Field-Value $objText "projectManager"
        }
    }
    
    if (-not $projectInfo.ContainsKey($pid)) {
        $projectInfo[$pid] = @{
            "name" = "(未找到)"; "status" = ""; "approvalStatus" = ""
            "startDate" = ""; "endDate" = ""; "manager" = ""
        }
    }
    
    Write-Host "  $pid - $($projectInfo[$pid]['name']) | 状态:$($projectInfo[$pid]['status']) | 审批:$($projectInfo[$pid]['approvalStatus'])"
}
Write-Host ""

# ============ 2. 解析 contracts.ts ============
Write-Host "--- [2/7] 解析 contracts.ts ---" -ForegroundColor Yellow
$contractsPath = "$dataDir\contracts.ts"
$contractsContent = Get-Content $contractsPath -Raw -Encoding UTF8

$contractInfo = @{}
foreach ($pid in $targetProjects) {
    # 搜索包含该项目编号的合同对象
    $idx = $contractsContent.IndexOf($pid)
    if ($idx -gt 0) {
        $startIdx = $contractsContent.LastIndexOf("{", $idx)
        $endIdx = $contractsContent.IndexOf("}", $idx)
        if ($startIdx -gt 0 -and $endIdx -gt $startIdx) {
            $objText = $contractsContent.Substring($startIdx, $endIdx - $startIdx + 1)
            $contractInfo[$pid] = @{
                "contractNo" = Get-Field-Value $objText "contractNo|contractNumber"
                "status" = Get-Field-Value $objText "status"
                "signDate" = Get-Field-Value $objText "signDate|signedDate"
                "startDate" = Get-Field-Value $objText "startDate"
                "endDate" = Get-Field-Value $objText "endDate"
                "progress" = Get-Field-Value $objText "progress"
            }
        }
    }
    
    if (-not $contractInfo.ContainsKey($pid)) {
        $contractInfo[$pid] = @{
            "contractNo" = "(未找到)"; "status" = ""; "signDate" = ""
            "startDate" = ""; "endDate" = ""; "progress" = ""
        }
    }
    
    Write-Host "  $pid - 合同:$($contractInfo[$pid]['contractNo']) | 状态:$($contractInfo[$pid]['status']) | 进度:$($contractInfo[$pid]['progress'])"
}
Write-Host ""

# ============ 3. 统计各模块数据条目数 ============
Write-Host "--- [3/7] 统计各模块数据条目数 ---" -ForegroundColor Yellow
$modules = @("plans","quality","safety","changes","schedule","allocations","infoDocuments","acceptance","payments","contractMgmt")
$moduleCounts = @{}

foreach ($mod in $modules) {
    $filePath = "$dataDir\$mod.ts"
    $counts = Count-By-Project $filePath
    $moduleCounts[$mod] = $counts
    
    Write-Host "  [$mod.ts]"
    foreach ($pid in $targetProjects) {
        $cnt = 0
        if ($counts.ContainsKey($pid)) { $cnt = $counts[$pid] }
        Write-Host "    $pid : $cnt 条"
    }
}
Write-Host ""

# ============ 4. 验证引用一致性 ============
Write-Host "--- [4/7] 验证无悬空引用 ---" -ForegroundColor Yellow
$allProjectIds = @()
$allFiles = @()
foreach ($mod in $modules) {
    $filePath = "$dataDir\$mod.ts"
    if (Test-Path $filePath) {
        $allFiles += "$mod.ts"
        $allProjectIds += Get-All-ProjectIds $filePath
    }
}
# 额外检查 contracts.ts
$allFiles += "contracts.ts"
$allProjectIds += Get-All-ProjectIds "$dataDir\contracts.ts"

$allProjectIds = $allProjectIds | Select-Object -Unique

# 从 projects.ts 中提取所有有效项目编号
$validProjectIds = @()
$projPattern = "projectCode\s*[:]\s*['`"`]([^'`"`n]+)['`"`]"
$projMatches = [regex]::Matches($projectsContent, $projPattern)
foreach ($m in $projMatches) {
    $validProjectIds += $m.Groups[1].Value
}
$validProjectIds = $validProjectIds | Select-Object -Unique

Write-Host "  projects.ts 中找到 $($validProjectIds.Count) 个有效项目编号"
Write-Host "  各模块中共引用 $($allProjectIds.Count) 个不同项目编号"

$danglingRefs = @()
foreach ($id in $allProjectIds) {
    if ($id -notin $validProjectIds) {
        $danglingRefs += $id
    }
}
Write-Host "  悬空引用数量: $($danglingRefs.Count)"
foreach ($dr in $danglingRefs) {
    Write-Host "    ! 悬空引用: $dr"
}
Write-Host ""

# ============ 5. 验证状态一致性 ============
Write-Host "--- [5/7] 验证状态/时间线一致性 ---" -ForegroundColor Yellow
$issues = [System.Collections.ArrayList]@()

foreach ($pid in $targetProjects) {
    $pInfo = $projectInfo[$pid]
    $cInfo = $contractInfo[$pid]
    $pStatus = $pInfo["status"]
    $cStatus = $cInfo["status"]
    
    Write-Host "  [$pid] 项目状态:$pStatus / 合同状态:$cStatus / 合同进度:$($cInfo['progress'])"
    
    # 状态一致性验证
    if ($pStatus -eq "进行中" -and $cStatus -ne "执行中" -and $cStatus -ne "") {
        [void]$issues.Add("[$pid] 项目状态为'进行中'，但合同状态为'$cStatus'（应为'执行中'）")
    }
    if ($pStatus -eq "待审批" -and $cStatus -ne "待审批" -and $cStatus -ne "") {
        [void]$issues.Add("[$pid] 项目状态为'待审批'，但合同状态为'$cStatus'（应为'待审批'）")
    }
    if ($pStatus -eq "即将完工") {
        $progress = 0
        if ($cInfo["progress"] -match "\d+") { [int]$progress = [int]$matches[0] }
        if ($progress -lt 80 -and $progress -gt 0) {
            [void]$issues.Add("[$pid] 项目状态为'即将完工'，但合同进度仅为 $progress%（应>=80%）")
        }
    }
    
    # 时间线验证
    $pStart = $pInfo["startDate"]
    $cSign = $cInfo["signDate"]
    if ($pStart -and $cSign) {
        try {
            $pStartDate = [DateTime]::Parse($pStart)
            $cSignDate = [DateTime]::Parse($cSign)
            if ($pStartDate -lt $cSignDate) {
                [void]$issues.Add("[$pid] 项目开始日期 $pStart 早于合同签订日期 $cSign")
            }
        } catch {}
    }
}

# 检查质量问题日期
$qualityPath = "$dataDir\quality.ts"
if (Test-Path $qualityPath) {
    $qualityContent = Get-Content $qualityPath -Raw -Encoding UTF8
    foreach ($pid in $targetProjects) {
        $idx = 0
        while (($idx = $qualityContent.IndexOf($pid, $idx)) -gt 0) {
            $blockStart = $qualityContent.LastIndexOf("{", $idx)
            $blockEnd = $qualityContent.IndexOf("}", $idx)
            if ($blockStart -gt 0 -and $blockEnd -gt $blockStart) {
                $block = $qualityContent.Substring($blockStart, $blockEnd - $blockStart + 1)
                $discoveryDate = Get-Field-Value $block "discoveryDate|findDate|发现日期|发现时间|issueDate|date"
                $pStart = $projectInfo[$pid]["startDate"]
                if ($discoveryDate -and $pStart) {
                    try {
                        $dDate = [DateTime]::Parse($discoveryDate)
                        $sDate = [DateTime]::Parse($pStart)
                        if ($dDate -lt $sDate) {
                            [void]$issues.Add("[$pid] 质量问题日期 $discoveryDate 早于项目开始日期 $pStart")
                        }
                    } catch {}
                }
            }
            $idx = $blockEnd + 1
        }
    }
}

Write-Host ""
Write-Host "  发现一致性问题: $($issues.Count) 个"
foreach ($iss in $issues) {
    Write-Host "    ! $iss"
}
Write-Host ""

# ============ 6. 验证文档覆盖 ============
Write-Host "--- [6/7] 验证监理规划/实施细则覆盖 ---" -ForegroundColor Yellow
$docIssues = [System.Collections.ArrayList]@()
$plansCounts = $moduleCounts["plans"]

foreach ($pid in $targetProjects) {
    $pStatus = $projectInfo[$pid]["status"]
    $planCount = 0
    if ($plansCounts.ContainsKey($pid)) { $planCount = $plansCounts[$pid] }
    
    Write-Host "  [$pid] 状态:$pStatus / 规划/细则条目:$planCount"
    
    if ($pStatus -eq "进行中" -and $planCount -eq 0) {
        [void]$docIssues.Add("[$pid] 进行中项目缺少监理规划/实施细则")
    }
}

Write-Host ""
Write-Host "  文档覆盖问题: $($docIssues.Count) 个"
foreach ($iss in $docIssues) {
    Write-Host "    ! $iss"
}
Write-Host ""

# ============ 7. 汇总表格输出 ============
Write-Host "--- [7/7] 生成汇总报告 ---" -ForegroundColor Yellow
Write-Host ""
Write-Host "===== 项目数据汇总表 =====" -ForegroundColor Cyan
Write-Host "编号`t名称`t项目状态`t合同状态`t合同进度`t规划`t质量`t安全`t变更`t进度`t分配`t文档`t验收`t付款`t合同管理"

foreach ($pid in $targetProjects) {
    $pi = $projectInfo[$pid]
    $ci = $contractInfo[$pid]
    $row = "$pid`t$($pi['name'])`t$($pi['status'])`t$($ci['status'])`t$($ci['progress'])%"
    foreach ($mod in $modules) {
        $cnt = 0
        if ($moduleCounts[$mod].ContainsKey($pid)) { $cnt = $moduleCounts[$mod][$pid] }
        $row += "`t$cnt"
    }
    Write-Host $row
}

Write-Host ""
Write-Host "===== 问题汇总 =====" -ForegroundColor Red
Write-Host "引用一致性问题: $($danglingRefs.Count)"
Write-Host "状态/时间线一致性问题: $($issues.Count)"
Write-Host "文档覆盖问题: $($docIssues.Count)"
Write-Host ""

# 保存报告到文件
$report = @"
=== 信佰监理服务管理系统 - 数据验证报告 ===
生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

--- 项目信息 ---
"@
foreach ($pid in $targetProjects) {
    $pi = $projectInfo[$pid]
    $ci = $contractInfo[$pid]
    $report += "`n[$pid]`n"
    $report += "  项目名称: $($pi['name'])`n"
    $report += "  项目状态: $($pi['status'])`n"
    $report += "  审批状态: $($pi['approvalStatus'])`n"
    $report += "  开始日期: $($pi['startDate'])`n"
    $report += "  结束日期: $($pi['endDate'])`n"
    $report += "  项目经理: $($pi['manager'])`n"
    $report += "  合同编号: $($ci['contractNo'])`n"
    $report += "  合同状态: $($ci['status'])`n"
    $report += "  签订日期: $($ci['signDate'])`n"
    $report += "  合同开始: $($ci['startDate'])`n"
    $report += "  合同结束: $($ci['endDate'])`n"
    $report += "  合同进度: $($ci['progress'])`n"
    $report += "  数据统计:"
    foreach ($mod in $modules) {
        $cnt = 0
        if ($moduleCounts[$mod].ContainsKey($pid)) { $cnt = $moduleCounts[$mod][$pid] }
        $report += " $mod($cnt)"
    }
    $report += "`n"
}

$report += "`n--- 引用一致性 --`n"
$report += "有效项目数: $($validProjectIds.Count)`n"
$report += "悬空引用数: $($danglingRefs.Count)`n"
foreach ($dr in $danglingRefs) { $report += "  - $dr`n" }

$report += "`n--- 状态/时间线问题 ($($issues.Count)个) ---`n"
foreach ($iss in $issues) { $report += "  - $iss`n" }

$report += "`n--- 文档覆盖问题 ($($docIssues.Count)个) ---`n"
foreach ($iss in $docIssues) { $report += "  - $iss`n" }

$report | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "报告已保存至: $reportFile"
