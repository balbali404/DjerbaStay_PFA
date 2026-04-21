"""
API Test Script

Tests the budget estimation API endpoint with various scenarios.
Starts a Flask server, runs test cases, and displays results.
"""

import os
import subprocess
import sys
import time

import requests

# =============================================================================
# Configuration
# =============================================================================

API_BASE_URL = "http://127.0.0.1:5000"
SERVER_STARTUP_DELAY = 3  # seconds

TEST_CASES = [
    {
        "name": "Moderate budget, taxi, 5 people, 3 days",
        "payload": {"days": 3, "persons": 5, "budget_level": 2, "transport": "taxi"},
    },
    {
        "name": "Budget, bus, 6 people, 2 days",
        "payload": {"days": 2, "persons": 6, "budget_level": 1, "transport": "bus"},
    },
    {
        "name": "Minimum: 1 person, 1 day, budget",
        "payload": {"days": 1, "persons": 1, "budget_level": 1, "transport": "bus"},
    },
    {
        "name": "Luxury, car rental, 6 people, 7 days",
        "payload": {"days": 7, "persons": 6, "budget_level": 3, "transport": "car_rental"},
    },
]

# =============================================================================
# Server Management
# =============================================================================

def start_server():
    """Start the Flask server as a subprocess."""
    env = dict(os.environ, FLASK_DEBUG="false")
    process = subprocess.Popen(
        [sys.executable, "app.py"],
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(SERVER_STARTUP_DELAY)
    return process


def stop_server(process):
    """Terminate the Flask server."""
    process.terminate()
    process.wait()


# =============================================================================
# Test Execution
# =============================================================================

def run_test(test_case):
    """Run a single test case and return results."""
    name = test_case["name"]
    payload = test_case["payload"]
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/estimate_budget",
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
        return {
            "name": name,
            "payload": payload,
            "status": "PASS",
            "response": response.json(),
        }
    except requests.RequestException as error:
        return {
            "name": name,
            "payload": payload,
            "status": "FAIL",
            "error": str(error),
        }


def print_result(result):
    """Print formatted test result."""
    print(f"\n{'=' * 60}")
    print(f"Test: {result['name']}")
    print(f"Status: {result['status']}")
    print(f"Payload: {result['payload']}")
    
    if result["status"] == "PASS":
        response = result["response"]
        print(f"\nResponse:")
        print(f"  Total Cost:      {response.get('total_cost')} EUR")
        print(f"  Per Day:         {response.get('per_day')} EUR")
        print(f"  Activities:      {response.get('activities_cost')} EUR")
        print(f"  Food:            {response.get('food_cost')} EUR")
        print(f"  Transport:       {response.get('transport_cost')} EUR")
    else:
        print(f"Error: {result.get('error')}")


# =============================================================================
# Main
# =============================================================================

def main():
    """Run all API tests."""
    print("Starting Flask server...")
    server = start_server()
    
    try:
        print(f"Running {len(TEST_CASES)} test cases...")
        
        results = [run_test(test) for test in TEST_CASES]
        
        for result in results:
            print_result(result)
        
        # Summary
        passed = sum(1 for r in results if r["status"] == "PASS")
        total = len(results)
        
        print(f"\n{'=' * 60}")
        print(f"Summary: {passed}/{total} tests passed")
        
    finally:
        print("\nStopping server...")
        stop_server(server)


if __name__ == "__main__":
    main()
