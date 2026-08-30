use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

const SECRET_KEY: &[u8] = b"ARGUS_MASTER_DAEMON_SIGNATURE_KEY_2026";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapabilityToken {
    pub token_id: String,
    pub agent_id: String,
    pub capability: String,
    pub target: String,
    pub expires_at: u64,
    pub signature: String,
}

pub struct CapabilityManager;

impl CapabilityManager {
    pub fn mint_token(agent_id: &str, capability: &str, target: &str, ttl_seconds: u64) -> CapabilityToken {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let expires_at = now + ttl_seconds;
        let token_id = format!("TOK-{}", now);

        let payload = format!("{}:{}:{}:{}", token_id, agent_id, capability, target);
        let mut mac = HmacSha256::new_from_slice(SECRET_KEY).expect("HMAC can take key of any size");
        mac.update(payload.as_bytes());
        let result = mac.finalize();
        let signature = hex::encode(result.into_bytes());

        CapabilityToken {
            token_id,
            agent_id: agent_id.to_string(),
            capability: capability.to_string(),
            target: target.to_string(),
            expires_at,
            signature,
        }
    }

    pub fn verify_token(token: &CapabilityToken) -> bool {
        let payload = format!("{}:{}:{}:{}", token.token_id, token.agent_id, token.capability, token.target);
        let mut mac = HmacSha256::new_from_slice(SECRET_KEY).expect("HMAC can take key of any size");
        mac.update(payload.as_bytes());

        if let Ok(sig_bytes) = hex::decode(&token.signature) {
            mac.verify_slice(&sig_bytes).is_ok()
        } else {
            false
        }
    }
}
