import type { CodeIssue } from '@/types';

export const codeIssues: CodeIssue[] = [
  {
    id: 'issue-1',
    buildId: 'build-1',
    file: 'src/components/UserProfile.tsx',
    line: 45,
    severity: 'critical',
    type: 'bug',
    message: '可能的空指针异常，user 对象可能为 null',
    rule: 'react-hooks/exhaustive-deps',
    status: 'open',
  },
  {
    id: 'issue-2',
    buildId: 'build-1',
    file: 'src/utils/auth.ts',
    line: 128,
    severity: 'critical',
    type: 'vulnerability',
    message: '硬编码的 API 密钥存在安全风险',
    rule: 'security/no-hardcoded-secrets',
    status: 'open',
  },
  {
    id: 'issue-3',
    buildId: 'build-1',
    file: 'src/pages/OrderList.tsx',
    line: 234,
    severity: 'major',
    type: 'code_smell',
    message: '函数过长，建议拆分为多个小函数',
    rule: 'max-lines-per-function',
    status: 'open',
  },
  {
    id: 'issue-4',
    buildId: 'build-1',
    file: 'src/services/api.ts',
    line: 67,
    severity: 'major',
    type: 'bug',
    message: '错误处理不完整，缺少网络异常捕获',
    rule: 'no-empty-catch',
    status: 'open',
  },
  {
    id: 'issue-5',
    buildId: 'build-1',
    file: 'src/components/Button.tsx',
    line: 12,
    severity: 'major',
    type: 'duplication',
    message: '与 IconButton 组件存在 85% 的代码重复',
    rule: 'duplicate-code',
    status: 'fixed',
  },
  {
    id: 'issue-6',
    buildId: 'build-1',
    file: 'src/hooks/useDebounce.ts',
    line: 28,
    severity: 'minor',
    type: 'code_smell',
    message: '可以使用可选链简化代码',
    rule: 'prefer-optional-chain',
    status: 'open',
  },
  {
    id: 'issue-7',
    buildId: 'build-1',
    file: 'src/types/index.ts',
    line: 56,
    severity: 'minor',
    type: 'code_smell',
    message: '类型定义可以提取为公共类型',
    rule: '@typescript-eslint/no-duplicate-type-constituents',
    status: 'false_positive',
  },
  {
    id: 'issue-8',
    buildId: 'build-1',
    file: 'src/styles/globals.css',
    line: 234,
    severity: 'info',
    type: 'code_smell',
    message: '建议使用 CSS 变量替代硬编码颜色值',
    rule: 'color-no-hex',
    status: 'open',
  },
  {
    id: 'issue-9',
    buildId: 'build-1',
    file: 'src/utils/date.ts',
    line: 45,
    severity: 'info',
    type: 'code_smell',
    message: '考虑使用 date-fns 库替代手动日期处理',
    rule: 'no-native-date',
    status: 'open',
  },
  {
    id: 'issue-10',
    buildId: 'build-1',
    file: 'src/App.tsx',
    line: 1,
    severity: 'info',
    type: 'code_smell',
    message: '文件包含未使用的导入',
    rule: 'no-unused-imports',
    status: 'open',
  },
];

export function getIssuesByBuild(buildId: string): CodeIssue[] {
  return codeIssues.filter((i) => i.buildId === buildId);
}

export function getIssuesBySeverity(buildId: string, severity: CodeIssue['severity']): CodeIssue[] {
  return codeIssues.filter((i) => i.buildId === buildId && i.severity === severity);
}

export function getIssueStats(buildId: string) {
  const issues = getIssuesByBuild(buildId);
  return {
    total: issues.length,
    critical: issues.filter((i) => i.severity === 'critical').length,
    major: issues.filter((i) => i.severity === 'major').length,
    minor: issues.filter((i) => i.severity === 'minor').length,
    info: issues.filter((i) => i.severity === 'info').length,
    open: issues.filter((i) => i.status === 'open').length,
    fixed: issues.filter((i) => i.status === 'fixed').length,
  };
}
