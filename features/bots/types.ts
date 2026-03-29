export type NanobotAgentSummary = {
  id: string;
  name: string;
  config_path: string;
  workspace: string;
  model_name: string;
  session_count: number;
  skill_count: number;
  cron_count: number;
  last_session_at: string;
  last_session_label: string;
  has_memory: boolean;
  created_at: string;
};

export type NanobotAgent = {
  id: string;
  name: string;
  config_path: string;
  workspace: string;
};

export type NanobotSessionTurnAnchor = {
  index: number;
  anchor: string;
  title: string;
};

export type NanobotSessionSummary = {
  key: string;
  title: string;
  updated_at: string;
  updated_label: string;
  message_count: number;
  turn_count: number;
  preview: string;
  path: string;
  turns: NanobotSessionTurnAnchor[];
};

export type NanobotMessageView = {
  role: string;
  role_label: string;
  timestamp: string;
  content: string;
  tool_summary: string;
};

export type NanobotTurnView = {
  index: number;
  anchor: string;
  title: string;
  timestamp: string;
  user_message: NanobotMessageView | null;
  final_message: NanobotMessageView | null;
  process_messages: NanobotMessageView[];
};

export type NanobotSessionDetail = {
  key: string;
  path: string;
  message_count: number;
  turn_count: number;
  updated_at: string;
  updated_label: string;
  turns: NanobotTurnView[];
};

export type NanobotSecurityList = {
  path?: string;
  write_allow_text: string;
  read_deny_text: string;
};

export type NanobotConfigFile = {
  path: string;
  content: string;
};

export type NanobotChatResult = {
  session_key: string;
  user_content: string;
  assistant_content: string;
  sessions: NanobotSessionSummary[];
  detail: NanobotSessionDetail | null;
};

export type NanobotBootstrap = {
  agent: NanobotAgent;
  app_version: string;
  workspace_path: string;
  model_name: string;
  sessions: NanobotSessionSummary[];
  current_key: string | null;
  current_detail: NanobotSessionDetail | null;
  security_list: NanobotSecurityList;
};
