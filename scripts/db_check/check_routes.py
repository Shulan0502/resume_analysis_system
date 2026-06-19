from backend.full_app import app

print("已注册的路由:")
for rule in app.url_map.iter_rules():
    methods = ','.join(sorted(rule.methods - {'OPTIONS', 'HEAD'}))
    print(f"{rule.rule} -> {methods}")
