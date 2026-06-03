use serde::{Deserialize, Serialize};

const MODEL: &str = "claude-sonnet-4-6";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
enum ClaudeAction {
    NewPuzzle,
    Hint,
    CheckAnswer,
}

#[derive(Serialize)]
struct AnthropicRequest {
    model: &'static str,
    max_tokens: u32,
    messages: Vec<AnthropicMessage>,
}

#[derive(Serialize)]
struct AnthropicMessage {
    role: &'static str,
    content: String,
}

#[derive(Deserialize)]
struct AnthropicResponse {
    content: Vec<ContentBlock>,
}

#[derive(Deserialize)]
struct ContentBlock {
    text: String,
}

fn system_prompt(action: &ClaudeAction) -> &'static str {
    match action {
        ClaudeAction::NewPuzzle => {
            "You create fun pattern and sequence puzzles for a desktop game. \
             Reply with ONLY the puzzle text: a short sequence or pattern description \
             (symbols, numbers, shapes, or words) and one clear question. \
             Do not reveal the answer. Keep it under 120 words."
        }
        ClaudeAction::Hint => {
            "You give a single helpful hint for the pattern puzzle below. \
             Do not give the full answer. One or two sentences only."
        }
        ClaudeAction::CheckAnswer => {
            "You judge the player's answer to the pattern puzzle. \
             Say if they are correct, partly correct, or wrong, and briefly explain why. \
             Be encouraging. Under 100 words."
        }
    }
}

fn user_message(action: &ClaudeAction, puzzle: Option<&str>, answer: Option<&str>) -> String {
    match action {
        ClaudeAction::NewPuzzle => {
            "Generate a new pattern or sequence puzzle.".to_string()
        }
        ClaudeAction::Hint => format!(
            "Puzzle:\n{}\n\nGive a hint.",
            puzzle.unwrap_or("(no puzzle)")
        ),
        ClaudeAction::CheckAnswer => format!(
            "Puzzle:\n{}\n\nPlayer answer:\n{}\n\nJudge this answer.",
            puzzle.unwrap_or("(no puzzle)"),
            answer.unwrap_or("(empty)")
        ),
    }
}

fn api_key() -> Result<String, String> {
    std::env::var("ANTHROPIC_API_KEY").map_err(|_| {
        "ANTHROPIC_API_KEY is not set. Copy .env.example to .env in the project folder.".into()
    })
}

#[tauri::command]
async fn ask_claude(
    action: String,
    puzzle: Option<String>,
    answer: Option<String>,
) -> Result<String, String> {
    let action: ClaudeAction = serde_json::from_value(serde_json::json!(action))
        .map_err(|e| format!("Invalid action: {e}"))?;

    let key = api_key()?;
    let body = AnthropicRequest {
        model: MODEL,
        max_tokens: 512,
        messages: vec![AnthropicMessage {
            role: "user",
            content: format!(
                "{}\n\n{}",
                system_prompt(&action),
                user_message(
                    &action,
                    puzzle.as_deref(),
                    answer.as_deref(),
                )
            ),
        }],
    };

    let client = reqwest::Client::new();
    let res = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {e}"))?;

    if !res.status().is_success() {
        let status = res.status();
        let err_body = res.text().await.unwrap_or_default();
        return Err(format!("Claude API error ({status}): {err_body}"));
    }

    let parsed: AnthropicResponse = res
        .json()
        .await
        .map_err(|e| format!("Invalid response: {e}"))?;

    parsed
        .content
        .into_iter()
        .next()
        .map(|b| b.text)
        .ok_or_else(|| "Empty response from Claude".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|_| {
            if let Ok(cwd) = std::env::current_dir() {
                let _ = dotenvy::from_path(cwd.join(".env"));
                if let Some(parent) = cwd.parent() {
                    let _ = dotenvy::from_path(parent.join(".env"));
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![ask_claude])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
