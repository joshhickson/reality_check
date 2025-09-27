import re
import json
import sys  # Import sys module to handle command-line arguments
from collections import defaultdict
import numpy as np

def parse_log_file(filepath):
    try:
        with open(filepath, 'r') as f:
            log_content = f.read()
    except FileNotFoundError:
        print(f"Error: Log file not found at '{filepath}'")
        return None

    # --- Regex Patterns ---
    turn_pattern = re.compile(r"--- \[(HustlerBot-\d|ZenBot-\d)\] Turn (\d+) ---")
    stats_pattern = re.compile(r"My Stats: AP=(\d+), Hand=(\d+), MH=.*, NM=(\d+)")
    action_pattern = re.compile(r"\[(HustlerBot-\d|ZenBot-\d)\] Taking action: (WORK_OVERTIME|DRAW_CARD|PLAY_CARD|SPEND_MOMENTUM|PASS_TURN)(?: \{ (.*) \})?")
    crossroads_decision_pattern = re.compile(r"\[(HustlerBot-\d|ZenBot-\d)\] Decision: \"(.*)\"")
    crossroads_choice_pattern = re.compile(r"\[(HustlerBot-\d|ZenBot-\d)\] Choosing option \d+: \"(.*)\"")
    winner_pattern = re.compile(r"Winner: (HustlerBot-\d|ZenBot-\d)")
    final_scores_pattern = re.compile(r"Final Scores: (\[[\s\S]*?\])")
    card_resolved_pattern = re.compile(r"\[(HustlerBot-\d|ZenBot-\d)\] Card resolved: (.*)")

    # --- Data Structures ---
    game_data = {
        "turns": [],
        "crossroads_events": [],
        "winner": None,
        "final_scores": None,
        "game_flow": []
    }
    current_turn_data = None

    lines = log_content.split('\n')

    for i, line in enumerate(lines):
        turn_match = turn_pattern.search(line)
        if turn_match:
            if current_turn_data:
                game_data["turns"].append(current_turn_data)

            bot_name, turn_number = turn_match.groups()
            turn_number = int(turn_number)
            game_data["game_flow"].append(f"Turn {turn_number} Start: {bot_name}")

            stats_line_offset = 1
            stats_match = None
            while i + stats_line_offset < len(lines) and stats_line_offset < 4:
                stats_match = stats_pattern.search(lines[i+stats_line_offset])
                if stats_match: break
                stats_line_offset += 1

            if stats_match:
                ap, hand, nm = stats_match.groups()
                current_turn_data = {
                    "turn_number": turn_number,
                    "bot": bot_name,
                    "archetype": "Hustler" if "Hustler" in bot_name else "Zen",
                    "start_nm": int(nm),
                    "actions": []
                }

        action_match = action_pattern.search(line)
        if action_match and current_turn_data:
            bot_name, action_type, action_payload = action_match.groups()
            if bot_name == current_turn_data["bot"]:
                action_details = {"type": action_type}
                if action_payload and "cardId" in action_payload:
                    card_id_match = re.search(r"cardId: '(.*)'", action_payload)
                    if card_id_match:
                        action_details["card"] = card_id_match.group(1)
                current_turn_data["actions"].append(action_details)

        crossroads_decision_match = crossroads_decision_pattern.search(line)
        if crossroads_decision_match:
            bot_name, decision_text = crossroads_decision_match.groups()
            game_data["game_flow"].append(f"Crossroads Triggered for {bot_name}")
            if i + 1 < len(lines):
                choice_match = crossroads_choice_pattern.search(lines[i+1])
                if choice_match:
                    _, choice_text = choice_match.groups()
                    game_data["crossroads_events"].append({
                        "bot": bot_name,
                        "archetype": "Hustler" if "Hustler" in bot_name else "Zen",
                        "turn": current_turn_data["turn_number"] if current_turn_data else "Unknown",
                        "decision": decision_text,
                        "choice": choice_text
                    })

        card_resolved_match = card_resolved_pattern.search(line)
        if card_resolved_match:
            bot_name, choice_text = card_resolved_match.groups()
            if game_data["game_flow"] and "Crossroads Triggered" in game_data["game_flow"][-1]:
                 game_data["game_flow"].append(f"Crossroads Resolved for {bot_name}. Returning to normal flow.")

        winner_match = winner_pattern.search(line)
        if winner_match:
            game_data["winner"] = winner_match.group(1)

        final_scores_match = final_scores_pattern.search(line)
        if final_scores_match:
            try:
                scores_text = final_scores_match.group(1).replace("'", '"')
                game_data["final_scores"] = json.loads(scores_text)
            except json.JSONDecodeError:
                pass

    if current_turn_data:
        game_data["turns"].append(current_turn_data)

    return game_data

def run_quantitative_analysis(data):
    print("\n--- Stage 1: Quantitative Analysis & Balance Baselining ---")
    if not data or not data.get('turns'):
        print("\nCould not parse game data. Analysis cannot be run.")
        return

    # 1. Collate Archetype Performance Data
    print("\n1. Archetype Performance Data:")
    winner_name = data.get('winner', 'Unknown')
    if winner_name != 'Unknown':
        winner_archetype = "Hustler" if "Hustler" in winner_name else "Zen"
        print(f"  - Winning Bot: {winner_name} ({winner_archetype})")
        print("  - Win/Loss Record (1 Game):")
        print(f"    - Hustler: {'1 Win, 0 Losses' if winner_archetype == 'Hustler' else '0 Wins, 1 Loss'}")
        print(f"    - Zen: {'1 Win, 0 Losses' if winner_archetype == 'Zen' else '0 Wins, 1 Loss'}")
        print("  - Win Rate:")
        print(f"    - Hustler: {'100%' if winner_archetype == 'Hustler' else '0%'}")
        print(f"    - Zen: {'100%' if winner_archetype == 'Zen' else '0%'}")
    else:
        print("  - Winner could not be determined from the log.")


    # 2. Measure Game Length & Pacing
    print("\n2. Game Length & Pacing:")
    total_turns = max(t['turn_number'] for t in data['turns'])
    print(f"  - Total Turns: {total_turns}")
    print(f"  - Average/Median/Range: {total_turns} turns (single game)")

    # 3. Track "Narrative Momentum" (NM) Velocity
    print("\n3. Narrative Momentum (NM) Velocity:")
    nm_by_archetype = defaultdict(list)
    for turn in data['turns']:
        nm_by_archetype[turn['archetype']].append((turn['turn_number'], turn['start_nm']))

    for archetype, nms in nm_by_archetype.items():
        if len(nms) > 1:
            total_nm_gain = nms[-1][1] - nms[0][1]
            avg_gain_per_turn = total_nm_gain / len(nms)
            print(f"  - {archetype}:")
            print(f"    - Average NM Gain per Turn: {avg_gain_per_turn:.2f}")

    final_quarter_start_turn = total_turns * 0.75
    print(f"  - Final 25% of Game (Turns > {int(final_quarter_start_turn)}):")
    for archetype, nms in nm_by_archetype.items():
        final_nms = [nm for turn, nm in nms if turn >= final_quarter_start_turn]
        if len(final_nms) > 1:
            initial_nm_in_quarter = final_nms[0]
            final_nm_in_quarter = final_nms[-1]
            nm_gain_in_final_quarter = final_nm_in_quarter - initial_nm_in_quarter
            print(f"    - {archetype} NM gain in final quarter: {nm_gain_in_final_quarter}")

    # 4. Log Action Frequency
    print("\n4. Action Frequency:")
    action_counts = defaultdict(lambda: defaultdict(int))
    for turn in data['turns']:
        archetype = turn['archetype']
        for action in turn['actions']:
            action_counts[archetype][action['type']] += 1

    for archetype in sorted(action_counts.keys()):
        print(f"  - {archetype} Archetype:")
        for action, count in sorted(action_counts[archetype].items()):
            print(f"    - {action}: {count}")

def run_qualitative_analysis(data):
    print("\n--- Stage 2: Qualitative Systems Analysis & Debugging Post-Mortem ---")
    if not data:
        return

    # 1. Deep-Dive on the Crossroads System
    print("\n1. Deep-Dive on the Crossroads System:")
    if not data['crossroads_events']:
        print("  - No Crossroads events were captured.")
    else:
        for i, event in enumerate(data['crossroads_events']):
            print(f"\n  - Event #{i+1} (Turn {event['turn']})")
            print(f"    - Bot: {event['bot']} ({event['archetype']})")
            print(f"    - Situation: {event['decision']}")
            print(f"    - Choice Made: {event['choice']}")

    # 2. Evaluate PLAY_CARD Logic and Impact
    print("\n2. Evaluate PLAY_CARD Logic and Impact:")
    for archetype in ["Hustler", "Zen"]:
        cards = [action['card'] for turn in data['turns'] if turn['archetype'] == archetype for action in turn['actions'] if action['type'] == 'PLAY_CARD' and 'card' in action]
        card_type = "Sin" if archetype == "Hustler" else "Virtue"
        print(f"  - {archetype} Archetype played {len(cards)} cards (expected {card_type} cards).")

    # 3. Confirm Game State Integrity
    print("\n3. Confirm Game State Integrity:")
    flow_ok = True
    for i, flow_item in enumerate(data['game_flow']):
        if "Crossroads Triggered" in flow_item:
            if i + 1 >= len(data['game_flow']) or "Crossroads Resolved" not in data['game_flow'][i+1]:
                flow_ok = False

    if flow_ok:
        print("  - VERIFIED: The game flow correctly transitions from a Crossroads event back to the normal turn sequence.")
    else:
        print("  - FAILED: A potential game hang was detected after a Crossroads event.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python log_analyzer.py <path_to_log_file>")
        sys.exit(1)

    log_file_path = sys.argv[1]
    parsed_data = parse_log_file(log_file_path)

    if parsed_data:
        run_quantitative_analysis(parsed_data)
        run_qualitative_analysis(parsed_data)
        print("\n--- Analysis Complete ---")