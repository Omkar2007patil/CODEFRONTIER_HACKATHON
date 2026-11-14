"""Simulates the exact judge demonstration sequence from clean state."""

from fastapi.testclient import TestClient
from app.main import app

def run_judge_demo():
    c = TestClient(app)

    # Step 1: Preset Reset to clean Preset 1
    r1 = c.post('/api/sample/reset?preset_id=apex-core-2026')
    assert r1.status_code == 200
    p = r1.json()['project']
    print('[Demo Step 1 OK] Preset loaded:', p['project_name'], '| Status:', p['status'])

    # Step 2: Login as Reviewer
    r2 = c.post('/api/auth/demo-login', json={'role': 'project_reviewer'})
    assert r2.status_code == 200
    token_rev = r2.json()['access_token']
    print('[Demo Step 2 OK] Logged in as:', r2.json()['user']['full_name'])

    # Step 3: Conflict Resolution
    cid = p['conflicts'][0]['id']
    pid = p['project_id']
    r3 = c.post(
        f'/api/projects/{pid}/conflicts/{cid}/resolve',
        headers={'Authorization': f'Bearer {token_rev}'},
        json={
            'status': 'resolved',
            'resolution_choice': 'claim_1',
            'rationale': 'Nov 10 API freeze confirmed with Alex Chen. Launch postponed to Nov 24 to preserve 14-day bake period.'
        }
    )
    assert r3.status_code == 200
    print('[Demo Step 3 OK] Conflict resolved:', cid)

    # Step 4: Batch Approve Claims
    r4 = c.post('/api/claims/approve-all', headers={'Authorization': f'Bearer {token_rev}'})
    assert r4.status_code == 200
    print('[Demo Step 4 OK] All claims approved')

    # Step 5: Lock Handover
    r5 = c.post(
        f'/api/projects/{pid}/approve',
        headers={'Authorization': f'Bearer {token_rev}'},
        json={'status': 'approved', 'notes': 'Handover locked after resolving freeze contradiction.'}
    )
    assert r5.status_code == 200
    print('[Demo Step 5 OK] Handover package locked & approved')

    # Step 6: Successor Login & Package Access
    r6_auth = c.post('/api/auth/demo-login', json={'role': 'incoming_successor'})
    token_succ = r6_auth.json()['access_token']
    r6 = c.get(
        f'/api/projects/{pid}/successor-package',
        headers={'Authorization': f'Bearer {token_succ}'}
    )
    assert r6.status_code == 200
    succ_pkg = r6.json()
    print('[Demo Step 6 OK] Successor accessed approved package. Total claims:', len(succ_pkg['claims']))

    # Step 7: Check Redaction
    raw_succ = str(succ_pkg)
    assert 'ghp_mockApexTestStagingToken994821034' not in raw_succ
    assert '[REDACTED' in raw_succ
    print('[Demo Step 7 OK] Zero secret leak verified in successor package')

    # Step 8: Successor Checklist Progress
    r8 = c.put(
        f'/api/projects/{pid}/checklist/verify_environment',
        headers={'Authorization': f'Bearer {token_succ}'},
        json={'status': 'completed', 'notes': 'Verified staging connection'}
    )
    assert r8.status_code == 200
    print('[Demo Step 8 OK] Checklist updated by successor:', r8.json()['task_key'], '->', r8.json()['status'])

    # Step 9: Export Markdown & JSON
    r9_md = c.get(f'/api/projects/{pid}/export/markdown')
    assert r9_md.status_code == 200
    assert 'ghp_mockApexTestStagingToken994821034' not in r9_md.text
    r9_json = c.get(f'/api/projects/{pid}/export/audit-json')
    assert r9_json.status_code == 200
    assert 'ghp_mockApexTestStagingToken994821034' not in r9_json.text
    print('[Demo Step 9 OK] Exports generated cleanly with zero credential leaks')
    print('\n>>> FULL JUDGE DEMONSTRATION RUN SUCCESSFUL <<<')

    # Reset back to initial state for user
    c.post('/api/sample/reset?preset_id=apex-core-2026')

if __name__ == '__main__':
    run_judge_demo()
