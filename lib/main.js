addEventListener("DOMContentLoaded", () => {
	document.querySelector('.button-contact').addEventListener('click', function(event) {
	    event.preventDefault();
	
	    const emailText = this.querySelector('.button-contact__email').innerText;
	
	    navigator.clipboard.writeText(emailText).then(() => {
	        showToast("Email copied to clipboard!");
	    });
	});
	
	function showToast(message) {
	    
	    const toast = document.createElement('div');
	    toast.className = 'copy-notification';
	    toast.innerText = message;
	    document.body.appendChild(toast);
	
	    
	    setTimeout(() => toast.classList.add('show'), 100);
	
	    
	    setTimeout(() => {
	        toast.classList.remove('show');
	        setTimeout(() => toast.remove(), 300); 
	    }, 2500);
	}
});
