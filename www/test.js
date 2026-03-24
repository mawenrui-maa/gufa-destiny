// 测试核心逻辑
console.log('Testing AncientDestinySystem...');

// 测试用例：取自原Python版本的测试1
const birth_data = {
    lunar_year: 1986,
    lunar_month: 1,
    lunar_day: 13,
    hour: 23,
    gender: '女'
};

const system = new AncientDestinySystem();

// 测试四柱计算
const pillars = system.calculate_stem_branch(birth_data);
console.log('=== 四柱计算 ===');
console.log('年柱:', pillars.year);
console.log('月柱:', pillars.month);
console.log('日柱:', pillars.day.branches);
console.log('时柱:', pillars.hour);
console.log('');

// 测试大运
const da_yun = system.calculate_da_yun(pillars, birth_data.gender, birth_data.lunar_month, birth_data.lunar_year);
console.log('=== 大运计算 ===');
console.log('大运数量:', da_yun.length);
da_yun.forEach((d, i) => {
    console.log(`  ${i+1}. ${d.age_range}: ${d.branch}`);
});
console.log('');

// 测试神煞分析
const shensha = system.shen_sha_analysis(pillars);
console.log('=== 神煞分析 ===');
console.log('八煞:', shensha.ba_sha);
console.log('白虎:', shensha.white_tiger);
console.log('三煞:', shensha.san_sha);
console.log('三合局:', shensha.san_he_ju);
console.log('天乙贵人:', shensha.tianyi_guiren);
console.log('三刑:', shensha.branch_relations['三刑']);
console.log('');

// 测试十二宫
const [twelve_palaces, ming_gong] = system.calculate_twelve_palaces(birth_data.lunar_month, pillars.hour.branch);
console.log('=== 十二宫计算 ===');
console.log('命宫:', ming_gong);
console.log('所有宫位:');
for (const [name, branch] of Object.entries(twelve_palaces)) {
    console.log(`  ${name}: ${branch}`);
}

console.log('\n✅ 所有核心逻辑测试完成！');
