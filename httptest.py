from flask import Flask, request

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        data = request.get_json(force=True)
        print("Received POST:", data)
        return {"status": "success", "received": data}, 200
    return {"message": "HTTP test endpoint is running"}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
