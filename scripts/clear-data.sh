#!/bin/bash

# 数据清理脚本
# 执行此脚本将清空所有监控数据，包括：
# - 监控目标
# - 分组数据  
# - 任务记录
# - 性能指标数据
# - 截图文件
# - 白屏检测配置（恢复默认）

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/packages/server/data"
SCREENSHOTS_DIR="$PROJECT_DIR/packages/server/screenshots"

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 确保目录存在
ensure_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        log_info "创建目录: $dir"
    fi
}

# 清理截图文件
clear_screenshots() {
    log_info "清理截图文件..."
    
    if [ -d "$SCREENSHOTS_DIR" ]; then
        local count=0
        for file in "$SCREENSHOTS_DIR"/*.{png,jpg,jpeg}; do
            if [ -f "$file" ]; then
                rm -f "$file"
                log_info "删除截图: $(basename "$file")"
                ((count++))
            fi
        done
        
        if [ $count -eq 0 ]; then
            log_info "没有找到截图文件"
        else
            log_success "清理完成，删除了 $count 个截图文件"
        fi
    else
        log_warning "截图目录不存在，跳过清理"
    fi
    echo
}

# 创建默认JSON文件
create_default_files() {
    log_info "创建默认数据文件..."
    
    # 默认分组数据
    cat > "$DATA_DIR/groups.json" << EOF
[
  {
    "id": "default-group-001",
    "name": "默认分组",
    "color": "#1890ff",
    "description": "系统默认分组",
    "createdAt": $(date +%s)000
  }
]
EOF
    log_success "创建默认分组文件"
    
    # 清空监控目标
    echo "[]" > "$DATA_DIR/targets.json"
    log_success "清空监控目标文件"
    
    # 清空任务记录
    echo "[]" > "$DATA_DIR/tasks.json"
    log_success "清空任务记录文件"
    
    # 清空性能指标
    echo "[]" > "$DATA_DIR/metrics.json"
    log_success "清空性能指标文件"
    
    # 清空标签数据
    echo "[]" > "$DATA_DIR/tags.json"
    log_success "清空标签数据文件"
    
    # 删除白屏检测配置文件，让初始化脚本重新创建
    if [ -f "$DATA_DIR/blank-screen-config.json" ]; then
        rm -f "$DATA_DIR/blank-screen-config.json"
        log_success "删除现有白屏检测配置文件"
    fi
    echo
}

# 初始化系统配置
initialize_configs() {
    log_info "初始化系统配置..."
    
    # 检查是否需要编译服务器
    if [ ! -f "$PROJECT_DIR/packages/server/dist/services/initialization.js" ]; then
        log_info "编译服务器代码..."
        cd "$PROJECT_DIR/packages/server"
        npm run build || {
            log_error "服务器编译失败"
            return 1
        }
        cd "$PROJECT_DIR"
        log_success "服务器编译完成"
    fi
    
    # 运行初始化脚本
    log_info "运行配置初始化脚本..."
    cd "$PROJECT_DIR"
    node scripts/init-config.js || {
        log_error "配置初始化失败"
        return 1
    }
    
    log_success "系统配置初始化完成"
    echo
}

# 显示清理结果
show_results() {
    echo
    log_success "数据清理和初始化完成！"
    echo
    echo -e "${BLUE}📋 处理结果:${NC}"
    echo "  ✓ 监控目标: 已清空"
    echo "  ✓ 分组数据: 已恢复为默认分组"
    echo "  ✓ 标签数据: 已清空"
    echo "  ✓ 任务记录: 已清空"
    echo "  ✓ 性能指标: 已清空"
    echo "  ✓ 截图文件: 已清空"
    echo "  ✓ 白屏检测配置: 已重新初始化为默认配置"
    echo
    log_success "系统已恢复到初始状态，可以重新开始使用！"
}

# 确认操作
confirm_operation() {
    if [[ "$1" == "--force" || "$1" == "-f" ]]; then
        return 0
    fi
    
    echo
    log_warning "此操作将清空所有监控数据，包括："
    echo "   - 所有监控目标"
    echo "   - 所有分组（除默认分组外）"
    echo "   - 所有任务记录"
    echo "   - 所有性能指标数据"
    echo "   - 所有截图文件"
    echo "   - 白屏检测配置（重新初始化）"
    echo
    
    read -p "确定要继续吗？输入 'yes' 确认: " response
    if [[ "$response" != "yes" ]]; then
        echo "操作已取消"
        exit 0
    fi
}

# 主函数
main() {
    echo -e "${BLUE}🧹 Page Probe 数据清理工具${NC}"
    echo "==============================="
    
    confirm_operation "$1"
    
    echo
    log_info "开始清理所有监控数据..."
    echo
    
    # 确保目录存在
    ensure_directory "$DATA_DIR"
    ensure_directory "$SCREENSHOTS_DIR"
    
    # 清理截图文件
    clear_screenshots
    
    # 创建默认数据文件
    create_default_files
    
    # 初始化系统配置
    initialize_configs
    
    # 显示结果
    show_results
}

# 运行主函数
main "$1" 