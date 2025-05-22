from flask import Flask, jsonify
import ansible_runner

app = Flask(__name__)

@app.route('/')
def hello():
    
    result = ansible_runner.run(private_data_dir='/app', playbook='hello.yml')
    
    
    return jsonify({
        'status': 'success',
        'msg': result.stdout.read(),
        'playbook': 'hello.yml'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5006)

