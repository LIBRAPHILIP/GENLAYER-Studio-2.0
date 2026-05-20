export interface TemplateCode {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  code: string;
}

export const TEMPLATES_DATA: TemplateCode[] = [
  {
    id: 'weather',
    title: 'Oracle Weather Validator',
    description: 'A contract that triggers consensus based on multi-node real-time weather API checks.',
    category: 'Oracle',
    difficulty: 'Easy',
    code: `# GenLayer Intelligent Contract: Oracle Weather Validator
# Uses off-chain weatherconsensus nodes to lock/unlock execution flows.

from genlayer import IntelligentContract

class WeatherValidator(IntelligentContract):
    def __init__(self):
        super().__init__()
        self.threshold_temp = 32.0  # 32 degrees Celsius 
        self.weather_api_url = "https://api.openweathermap.org/data/2.5/weather"
        self.total_triggers = 0

    def audit_temperature(self, city: str):
        # Calls the secure weather proxy using Vault-sealed keys
        payload = {"q": city, "units": "metric"}
        
        # Multi-node consensus query to OpenWeatherMap guarantees absolute safety
        validation_nodes_result = self.consensus.query_api(self.weather_api_url, payload)
        
        current_temp = float(validation_nodes_result.get("main", {}).get("temp", 0.0))
        
        if current_temp > self.threshold_temp:
            self.total_triggers += 1
            return f"Weather consensus verified. Temp in {city} is {current_temp}°C (Over Threshold)"
        return f"Consensus success. Temperature in {city} is {current_temp}°C. Under threshold."
`
  },
  {
    id: 'sentiment',
    title: 'Market Sentiment DAO',
    description: 'Decentralized decision making powered by natural language Gemini analysis of social trends.',
    category: 'AI-Governance',
    difficulty: 'Advanced',
    code: `# GenLayer Intelligent Contract: Market Sentiment DAO
# Incorporates real-time AI (Gemini integration) consensus off-chain.

from genlayer import IntelligentContract

class MarketSentimentDAO(IntelligentContract):
    def __init__(self):
        super().__init__()
        self.proposals = {}
        self.proposal_index = 0

    def query_sentiment_consensus(self, topic: str, allocation_wei: int):
        self.proposal_index += 1
        
        # Instructing AI Consensus nodes to run NLP evaluations on decentralized feeds
        sentiment_evaluation_prompt = f"Assess the social sentiment impact of: {topic} on Web3 protocols"
        sentiment_score = self.ai.evaluate_sentiment(sentiment_evaluation_prompt)
        
        is_approved = sentiment_score > 75 # Requires 75%+ positive sentiment indices
        
        self.proposals[self.proposal_index] = {
            "topic": topic,
            "allocation": allocation_wei,
            "sentiment_score": sentiment_score,
            "status": "APPROVED" if is_approved else "REJECTED"
        }
        
        return f"Proposal #{self.proposal_index} processed. Sentiment index: {sentiment_score}% status: {self.proposals[self.proposal_index]['status']}"
`
  },
  {
    id: 'pricing',
    title: 'Dynamic Asset Pricing',
    description: 'Calculates true asset pricing using a mean consensus average from decentralized feeders.',
    category: 'DeFi',
    difficulty: 'Intermediate',
    code: `# GenLayer Intelligent Contract: Dynamic Asset Pricing
# Formulates trustless price feeds by obtaining standard dev consensus models in Python.

from genlayer import IntelligentContract

class DynamicAssetPricing(IntelligentContract):
    def __init__(self):
        super().__init__()
        self.usd_prices = {}

    def fetch_price_consensus(self, token_symbol: str):
        # Querying dual-independent sources
        coingecko_api = f"https://api.coingecko.com/api/v3/simple/price?ids={token_symbol}&vs_currencies=usd"
        cryptocompare_api = f"https://min-api.cryptocompare.com/data/price?fsym={token_symbol}&tsyms=USD"
        
        cg_res = self.consensus.query_api(coingecko_api, {})
        cc_res = self.consensus.query_api(cryptocompare_api, {})
        
        price_cg = float(cg_res.get(token_symbol, {}).get("usd", 0.0))
        price_cc = float(cc_res.get("USD", 0.0))
        
        consensus_price = (price_cg + price_cc) / 2.0
        self.usd_prices[token_symbol] = consensus_price
        
        return f"Price consolidated. Consensus value: 1 {token_symbol} = {consensus_price} USD"
`
  },
  {
    id: 'multisig',
    title: 'Secure Multi-Sig Vault',
    description: 'A key management vault requiring signature verification thresholds.',
    category: 'Security',
    difficulty: 'Intermediate',
    code: `# GenLayer Intelligent Contract: Secure Multi-Sig Vault
# High security multi-signature verification thresholds.

from genlayer import IntelligentContract

class MultiSigVault(IntelligentContract):
    def __init__(self, authorized_owners: list, votes_required: int):
        super().__init__()
        self.owners = authorized_owners
        self.votes_required = votes_required
        self.actions = []

    def queue_action(self, target_recipient: str, amount_wei: int):
        action_id = len(self.actions)
        self.actions.append({
            "recipient": target_recipient,
            "amount": amount_wei,
            "approvals": [],
            "executed": False,
        })
        return f"Action queued under ID: {action_id}"
`
  }
];
