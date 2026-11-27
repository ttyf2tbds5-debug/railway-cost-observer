# Rules and resource hints

Projects → Edit rules controls alertsEnabled, forecastAlerts and anomalyMultiplier (1.5–20, default 3). POST /api/v1/projects/{id}/policy updates the same settings with admin authentication. Changes are audited. These are notification policies, never Railway spend limits or service shutdown rules.

Anomaly detection requires four valid usage intervals in the same billing period. It compares the last hourly spend with a recent median and a $0.05/hour noise floor. CPU hints require at least 24 hours of billing-period data: average CPU below 0.02 vCPU combined with average memory of at least 0.5 GB. Egress hints require at least $1 estimated egress and 20% of tracked service spend. Storage hints begin at 10 GB period-average stored data.

All hints expose the measured evidence. They are prompts to investigate, not savings guarantees or instructions to delete data. Period averages can hide peaks, short-lived workloads and newly created services. Confirm operational requirements in Railway before changing resources.
