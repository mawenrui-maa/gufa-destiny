// 古法命盘系统 - JavaScript核心逻辑
// 移植自Python版本

class AncientDestinySystem {
    constructor() {
        // 固定地支排列（表盘刻度，永不动）
        this.fixed_branches = ['辰', '卯', '寅', '丑', '子', '亥', '戌', '酉', '申', '巳', '午', '未'];
        
        // 十二宫名称
        this.twelve_palaces_names = [
            '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
            '迁移', '奴仆', '官禄', '田宅', '福德', '父母'
        ];
        
        // 地支数字映射
        this.branch_numbers = {
            '子': 1, '丑': 2, '寅': 3, '卯': 4, '辰': 5, '巳': 6,
            '午': 7, '未': 8, '申': 9, '酉': 10, '戌': 11, '亥': 12
        };
        
        // 地支数字反向映射
        this.number_branches = {
            1: '子', 2: '丑', 3: '寅', 4: '卯', 5: '辰', 6: '巳',
            7: '午', 8: '未', 9: '申', 10: '酉', 11: '戌', 12: '亥'
        };
        
        // 地支生肖映射
        this.branch_zodiac = {
            '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
            '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
            '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
        };
        
        // 十二天星映射
        this.branch_stars = {
            '子': '天慧星', '丑': '天病星', '寅': '天帝星', '卯': '天破星',
            '辰': '天狼星', '巳': '天文星', '午': '天禄星', '未': '天马星',
            '申': '天孤星', '酉': '天刑星', '戌': '天魁星', '亥': '天门星'
        };
        
        // 地支五行属性（修正版）
        this.branch_elements = {
            '子': '水', '丑': '水', '寅': '土', '卯': '木',
            '辰': '木', '巳': '火', '午': '火', '未': '土',
            '申': '土', '酉': '金', '戌': '金', '亥': '水'
        };
        
        // 三合局定义
        this.san_he_ju = {
            '寅午戌': {'branches': ['寅', '午', '戌'], 'middle': '午', 'element': '火'},
            '巳酉丑': {'branches': ['巳', '酉', '丑'], 'middle': '酉', 'element': '金'},
            '申子辰': {'branches': ['申', '子', '辰'], 'middle': '子', 'element': '水'},
            '亥卯未': {'branches': ['亥', '卯', '未'], 'middle': '卯', 'element': '木'}
        };
        
        // 三合局简写映射
        this.san_he_mapping = {
            '寅': '寅午戌', '午': '寅午戌', '戌': '寅午戌',
            '巳': '巳酉丑', '酉': '巳酉丑', '丑': '巳酉丑',
            '申': '申子辰', '子': '申子辰', '辰': '申子辰',
            '亥': '亥卯未', '卯': '亥卯未', '未': '亥卯未'
        };
        
        // 天干映射
        this.stem_mapping = {
            0: '甲', 1: '乙', 2: '丙', 3: '丁', 4: '戊',
            5: '己', 6: '庚', 7: '辛', 8: '壬', 9: '癸'
        };
        
        // 天干地支组合（用于流年）
        this.stem_branch_combination = {};
        // 生成甲子到癸亥
        const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        for (let i = 0; i < 60; i++) {
            this.stem_branch_combination[i] = stems[i % 10] + branches[i % 12];
        }
        
        // 月份地支映射（农历月->地支）
        this.month_branch_mapping = {
            1: '子', 2: '丑', 3: '寅', 4: '卯', 5: '辰', 6: '巳',
            7: '午', 8: '未', 9: '申', 10: '酉', 11: '戌', 12: '亥'
        };
        
        // 初始化神煞规则
        this._init_shen_sha_rules();
        
        // 初始化地支关系
        this._init_branch_relations();
    }
    
    _init_shen_sha_rules() {
        // 三煞规则
        this.san_sha_rules = {
            '亥卯未': {'jie': '申', 'bing': '酉', 'zai': '戌', 'wang': '寅'},
            '寅午戌': {'jie': '亥', 'bing': '子', 'zai': '丑', 'wang': '巳'},
            '巳酉丑': {'jie': '寅', 'bing': '卯', 'zai': '辰', 'wang': '申'},
            '申子辰': {'jie': '巳', 'bing': '午', 'zai': '未', 'wang': '亥'}
        };
        
        // 八煞组合
        this.ba_sha = [['子', '辰'], ['卯', '申'], ['巳', '酉'], ['午', '亥']];
        
        // 白虎组合 - 修改：三合局里没有中间那个字就形成了白虎
        this.white_tiger = [['寅', '戌'], ['巳', '丑'], ['申', '辰'], ['亥', '未']];
        
        // 天乙贵人规则
        this.tianyi_rules = {
            '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
            '乙': ['子', '申'], '己': ['子', '申'],
            '丙': ['亥', '酉'], '丁': ['亥', '酉'],
            '壬': ['卯', '巳'], '癸': ['卯', '巳'],
            '辛': ['寅', '午']
        };
        
        // 禄神规则
        this.lu_shen_rules = {
            '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
            '戊': '巳', '己': '午', '庚': '申', '辛': '酉',
            '壬': '亥', '癸': '子'
        };
        
        // 红鸾规则
        this.hongluan_rules = {
            '子': '卯', '丑': '寅', '寅': '丑', '卯': '子',
            '辰': '亥', '巳': '戌', '午': '酉', '未': '申',
            '申': '未', '酉': '午', '戌': '巳', '亥': '辰'
        };
        
        // 桃花规则
        this.taohua_rules = {
            '申子辰': '酉', '寅午戌': '卯', '亥卯未': '子', '巳酉丑': '午'
        };
        
        // 四季局规则
        this.season_rules = {
            '春季': {'zhi': ['寅', '卯', '辰'], 'gu_chen': '巳', 'gua_su': '丑'},
            '夏季': {'zhi': ['巳', '午', '未'], 'gu_chen': '申', 'gua_su': '辰'},
            '秋季': {'zhi': ['申', '酉', '戌'], 'gu_chen': '亥', 'gua_su': '未'},
            '冬季': {'zhi': ['亥', '子', '丑'], 'gu_chen': '寅', 'gua_su': '戌'}
        };
        
        // 年支季节映射
        this.year_season = {};
        for (const season in this.season_rules) {
            for (const zhi of this.season_rules[season].zhi) {
                this.year_season[zhi] = season;
            }
        }
    }
    
    _init_branch_relations() {
        // 三刑定义（修正：包含所有三刑类型）
        this.san_xing = {
            '无礼刑': [['子', '卯']],
            '恃势刑': [['寅', '巳'], ['巳', '申'], ['申', '寅']],
            '无恩刑': [['丑', '未'], ['未', '戌'], ['戌', '丑']],
            '自刑': ['辰', '午', '酉', '亥']
        };
        
        // 六冲
        this.liu_chong = [['子', '午'], ['丑', '未'], ['寅', '申'], 
                         ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
        
        // 六合
        this.liu_he = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], 
                      ['辰', '酉'], ['巳', '申'], ['午', '未']];
        
        // 六害
        this.liu_hai = [['子', '未'], ['丑', '午'], ['寅', '巳'], 
                       ['卯', '辰'], ['申', '亥'], ['酉', '戌']];
    }
    
    calculate_stem_branch(birth_data) {
        const pillars = {
            'year': {'stem': '', 'branch': ''},
            'month': {'branch': ''},
            'day': {'branches': []},
            'hour': {'branch': ''}
        };
        
        // 年柱计算
        const year = birth_data.lunar_year;
        let stem_idx = (year - 1984) % 10;
        if (stem_idx < 0) stem_idx += 10; // 处理负数
        pillars.year.stem = this.stem_mapping[stem_idx];
        
        let branch_idx = (year - 1984) % 12;
        if (branch_idx < 0) branch_idx += 12; // 处理负数
        const branches_list = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        pillars.year.branch = branches_list[branch_idx];
        
        // 月柱计算
        const lunar_month = birth_data.lunar_month;
        pillars.month.branch = this.month_branch_mapping[lunar_month];
        
        // 日柱计算
        const lunar_day = birth_data.lunar_day;
        pillars.day.branches = this.process_day_pillar(lunar_day);
        
        // 时柱计算
        pillars.hour.branch = this._get_hour_branch(birth_data.hour);
        
        return pillars;
    }
    
    process_day_pillar(day) {
        // 处理日柱地支 - 农历13日拆分为1(子)和3(寅)
        const branches = [];
        
        if (day === 13) {
            branches.push('子');
            branches.push('寅');
        } else if (day <= 12) {
            branches.push(this.number_branches[day]);
        } else {
            const day_str = String(day);
            for (const digit of day_str) {
                const num = parseInt(digit);
                if (1 <= num && num <= 12) {
                    branches.push(this.number_branches[num]);
                }
            }
        }
        
        return branches;
    }
    
    calculate_da_yun(pillars, gender, lunar_month, start_year) {
        // 计算大运和流年 - 从出生年开始，修正年龄显示为1-10岁开始
        const year_branch = pillars.year.branch;
        const year_number = this.branch_numbers[year_branch];
        
        // 定阴阳
        let is_yang = year_number % 2 === 1;
        let direction = 1; // 顺行
        
        if ((is_yang && gender === '女') || (!is_yang && gender === '男')) {
            direction = -1; // 逆行
        }
        
        // 计算第一步大运
        const branches_list = Object.keys(this.branch_numbers);
        const start_idx = branches_list.indexOf(year_branch);
        const steps = lunar_month - 1;
        
        let first_idx = (start_idx + steps * direction) % 12;
        if (first_idx < 0) first_idx += 12;
        
        // 排列10步大运（从出生年开始）
        const da_yun_list = [];
        let current_idx = first_idx;
        
        for (let i = 0; i < 10; i++) {
            const start_age = i * 10 + 1;
            const end_age = (i + 1) * 10;
            da_yun_list.push({
                'age_range': `${start_age}-${end_age}岁`,
                'branch': branches_list[current_idx],
                'start_year': start_year + i * 10
            });
            current_idx = (current_idx + direction) % 12;
            if (current_idx < 0) current_idx += 12;
        }
        
        return da_yun_list;
    }
    
    get_liu_nian(start_year, steps = 10) {
        // 获取流年信息
        const liu_nian = {};
        for (let i = 0; i < steps; i++) {
            const year = start_year + i * 10;
            const year_list = [];
            for (let j = 0; j < 10; j++) {
                const current_year = year + j;
                let stem_branch_idx = (current_year - 1984) % 60;
                if (stem_branch_idx < 0) stem_branch_idx += 60;
                year_list.push({
                    'year': current_year,
                    'stem_branch': this.stem_branch_combination[stem_branch_idx]
                });
            }
            liu_nian[`${year}-${year+9}`] = year_list;
        }
        return liu_nian;
    }
    
    calculate_twelve_palaces(lunar_month, hour_branch) {
        // 计算十二宫位置
        const traditional_branches = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
        
        const hour_num = this.branch_numbers[hour_branch];
        const month_index = (lunar_month - 1) % 12;
        let ming_index = (month_index - (hour_num - 1)) % 12;
        if (ming_index < 0) ming_index += 12;
        
        const ming_gong_branch = traditional_branches[ming_index];
        const ming_index_fixed = this.fixed_branches.indexOf(ming_gong_branch);
        
        const twelve_palaces = {};
        let current_idx = ming_index_fixed;
        
        for (let i = 0; i < this.twelve_palaces_names.length; i++) {
            const palace_name = this.twelve_palaces_names[i];
            const branch = this.fixed_branches[current_idx];
            twelve_palaces[palace_name] = branch;
            current_idx = (current_idx + 1) % 12;
        }
        
        return [twelve_palaces, ming_gong_branch];
    }
    
    _get_hour_branch(hour) {
        // 根据小时获取时辰地支
        const ranges = [
            [23, 0, '子'], [1, 2, '丑'], [3, 4, '寅'], [5, 6, '卯'],
            [7, 8, '辰'], [9, 10, '巳'], [11, 12, '午'], [13, 14, '未'],
            [15, 16, '申'], [17, 18, '酉'], [19, 20, '戌'], [21, 22, '亥']
        ];
        
        for (const [start, end, branch] of ranges) {
            if (start === 23 && (hour >= 23 || hour <= 0)) {
                return branch;
            } else if (start <= hour && hour <= end) {
                return branch;
            }
        }
        return null;
    }
    
    shen_sha_analysis(pillars) {
        // 神煞分析
        const all_branches = this._get_all_pillar_branches(pillars);
        const year_stem = pillars.year.stem;
        const year_branch = pillars.year.branch;
        
        const results = {};
        
        // 八煞分析
        results.ba_sha = this._check_ba_sha(all_branches);
        
        // 白虎分析
        results.white_tiger = this._check_white_tiger(all_branches);
        
        // 三煞分析
        results.san_sha = this._check_san_sha(year_branch, all_branches);
        
        // 三合局分析
        results.san_he_ju = this._check_san_he_ju(all_branches);
        
        // 天乙贵人分析
        results.tianyi_guiren = this._check_tianyi_guiren(year_stem, all_branches);
        
        // 禄神分析
        results.lu_shen = this._check_lu_shen(year_stem, all_branches);
        
        // 将星分析
        results.jiang_xing = this._check_jiang_xing(year_branch, all_branches);
        
        // 华盖分析
        results.hua_gai = this._check_hua_gai(year_branch, all_branches);
        
        // 红鸾分析
        results.hong_luan = this._check_hong_luan(year_branch, all_branches);
        
        // 天喜分析
        results.tian_xi = this._check_tian_xi(year_branch, all_branches);
        
        // 桃花分析
        results.tao_hua = this._check_tao_hua(year_branch, all_branches);
        
        // 孤辰分析
        results.gu_chen = this._check_gu_chen(year_branch, all_branches);
        
        // 寡宿分析
        results.gua_su = this._check_gua_su(year_branch, all_branches);
        
        // 地支关系分析（包括三刑）
        results.branch_relations = this._check_all_branch_relations(all_branches);
        
        return results;
    }
    
    _get_all_pillar_branches(pillars) {
        // 获取所有命盘地支
        const branches = [];
        branches.push(pillars.year.branch);
        branches.push(pillars.month.branch);
        branches.push(...pillars.day.branches);
        branches.push(pillars.hour.branch);
        return branches;
    }
    
    _check_ba_sha(all_branches) {
        const found = [];
        for (const pair of this.ba_sha) {
            if (all_branches.includes(pair[0]) && all_branches.includes(pair[1])) {
                found.push(pair);
            }
        }
        return found;
    }
    
    _check_white_tiger(all_branches) {
        // 检查白虎 - 修改逻辑：三合局里没有中间那个字就形成了白虎
        const found = [];
        
        for (const tiger_pair of this.white_tiger) {
            if (all_branches.includes(tiger_pair[0]) && all_branches.includes(tiger_pair[1])) {
                let san_he_ju_name = null;
                let middle_branch = null;
                
                if (tiger_pair[0] === '寅' && tiger_pair[1] === '戌') {
                    san_he_ju_name = '寅午戌';
                    middle_branch = '午';
                } else if (tiger_pair[0] === '巳' && tiger_pair[1] === '丑') {
                    san_he_ju_name = '巳酉丑';
                    middle_branch = '酉';
                } else if (tiger_pair[0] === '申' && tiger_pair[1] === '辰') {
                    san_he_ju_name = '申子辰';
                    middle_branch = '子';
                } else if (tiger_pair[0] === '亥' && tiger_pair[1] === '未') {
                    san_he_ju_name = '亥卯未';
                    middle_branch = '卯';
                }
                
                if (san_he_ju_name && all_branches.includes(middle_branch)) {
                    continue;
                }
                
                found.push(tiger_pair);
            }
        }
        
        return found;
    }
    
    _check_san_he_ju(all_branches) {
        // 检查三合局 - 修改：只有三个地支同时出现才叫三合局
        const found = [];
        
        for (const [san_he_name, san_he_data] of Object.entries(this.san_he_ju)) {
            const branches = san_he_data.branches;
            let count = 0;
            
            for (const branch of branches) {
                if (all_branches.includes(branch)) {
                    count++;
                }
            }
            
            if (count === 3) {
                found.push({
                    name: san_he_name,
                    element: san_he_data.element,
                    branches: branches,
                    complete: true
                });
            }
        }
        
        return found;
    }
    
    _check_san_sha(year_branch, all_branches) {
        const san_he = this.san_he_mapping[year_branch];
        if (!san_he) return {};
        const rules = this.san_sha_rules[san_he];
        const result = {};
        for (const [sha_type, target] of Object.entries(rules)) {
            if (all_branches.includes(target)) {
                result[sha_type] = target;
            }
        }
        return result;
    }
    
    _check_lu_shen(year_stem, all_branches) {
        const target = this.lu_shen_rules[year_stem];
        if (target && all_branches.includes(target)) {
            return target;
        }
        return null;
    }
    
    _check_tianyi_guiren(year_stem, all_branches) {
        const targets = this.tianyi_rules[year_stem] || [];
        const found = [];
        for (const target of targets) {
            if (all_branches.includes(target)) {
                found.push(target);
            }
        }
        return found;
    }
    
    _check_jiang_xing(year_branch, all_branches) {
        const san_he = this.san_he_mapping[year_branch];
        if (!san_he) return null;
        let target;
        if (san_he === '申子辰') target = '子';
        else if (san_he === '寅午戌') target = '午';
        else if (san_he === '巳酉丑') target = '酉';
        else if (san_he === '亥卯未') target = '卯';
        else return null;
        if (all_branches.includes(target)) {
            return target;
        }
        return null;
    }
    
    _check_hua_gai(year_branch, all_branches) {
        const san_he = this.san_he_mapping[year_branch];
        if (!san_he) return null;
        let target;
        if (san_he === '申子辰') target = '辰';
        else if (san_he === '寅午戌') target = '戌';
        else if (san_he === '巳酉丑') target = '丑';
        else if (san_he === '亥卯未') target = '未';
        else return null;
        if (all_branches.includes(target)) {
            return target;
        }
        return null;
    }
    
    _check_hong_luan(year_branch, all_branches) {
        const target = this.hongluan_rules[year_branch];
        if (target && all_branches.includes(target)) {
            return target;
        }
        return null;
    }
    
    _check_tian_xi(year_branch, all_branches) {
        const hongluan = this.hongluan_rules[year_branch];
        if (!hongluan) return null;
        let tianxi = null;
        for (const pair of this.liu_chong) {
            if (pair[0] === hongluan) {
                tianxi = pair[1];
                break;
            } else if (pair[1] === hongluan) {
                tianxi = pair[0];
                break;
            }
        }
        if (tianxi && all_branches.includes(tianxi)) {
            return tianxi;
        }
        return null;
    }
    
    _check_tao_hua(year_branch, all_branches) {
        const san_he = this.san_he_mapping[year_branch];
        if (!san_he) return null;
        const target = this.taohua_rules[san_he];
        if (target && all_branches.includes(target)) {
            return target;
        }
        return null;
    }
    
    _check_gu_chen(year_branch, all_branches) {
        const season = this.year_season[year_branch];
        if (!season) return null;
        const target = this.season_rules[season].gu_chen;
        if (all_branches.includes(target)) {
            return target;
        }
        return null;
    }
    
    _check_gua_su(year_branch, all_branches) {
        const season = this.year_season[year_branch];
        if (!season) return null;
        const target = this.season_rules[season].gua_su;
        if (all_branches.includes(target)) {
            return target;
        }
        return null;
    }
    
    _check_all_branch_relations(all_branches) {
        const results = {
            '三刑': [],
            '六冲': [],
            '六合': [],
            '六害': []
        };
        
        // 子卯刑（无礼刑）
        if (all_branches.includes('子') && all_branches.includes('卯')) {
            results['三刑'].push('子卯');
        }
        
        // 寅巳申三刑（恃势刑）
        const yi_si_shen = ['寅', '巳', '申'];
        let count_yi_si_shen = 0;
        for (const branch of yi_si_shen) {
            if (all_branches.includes(branch)) count_yi_si_shen++;
        }
        if (count_yi_si_shen >= 2) {
            const found = yi_si_shen.filter(b => all_branches.includes(b));
            results['三刑'].push(found.join(''));
        }
        
        // 丑未戌三刑（无恩刑）
        const chou_wei_xu = ['丑', '未', '戌'];
        let count_chou_wei_xu = 0;
        for (const branch of chou_wei_xu) {
            if (all_branches.includes(branch)) count_chou_wei_xu++;
        }
        if (count_chou_wei_xu >= 2) {
            const found = chou_wei_xu.filter(b => all_branches.includes(b));
            results['三刑'].push(found.join(''));
        }
        
        // 自刑：辰辰、午午、酉酉、亥亥
        for (const zhi of ['辰', '午', '酉', '亥']) {
            let count = all_branches.filter(b => b === zhi).length;
            if (count >= 2) {
                results['三刑'].push(zhi + zhi);
            }
        }
        
        // 检查六冲
        for (const pair of this.liu_chong) {
            if (all_branches.includes(pair[0]) && all_branches.includes(pair[1])) {
                results['六冲'].push(pair.join(''));
            }
        }
        
        // 检查六合
        for (const pair of this.liu_he) {
            if (all_branches.includes(pair[0]) && all_branches.includes(pair[1])) {
                results['六合'].push(pair.join(''));
            }
        }
        
        // 检查六害
        for (const pair of this.liu_hai) {
            if (all_branches.includes(pair[0]) && all_branches.includes(pair[1])) {
                results['六害'].push(pair.join(''));
            }
        }
        
        return results;
    }
    
    get_branch_info(branch) {
        // 获取地支的完整信息
        return {
            'branch': branch,
            'number': this.branch_numbers[branch],
            'zodiac': this.branch_zodiac[branch],
            'star': this.branch_stars[branch],
            'element': this.branch_elements[branch]
        };
    }
}
