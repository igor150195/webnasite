addEventListener("DOMContentLoaded", () => {
	document.querySelector('.button-contact').addEventListener('click', function(event) {
	    event.preventDefault(); // Останавливаем mailto
	
	    const emailText = this.querySelector('.button-contact__email').innerText;
	
	    navigator.clipboard.writeText(emailText).then(() => {
	        showToast("Email copied to clipboard!");
	    });
	});
	
	function showToast(message) {
	    // Создаем элемент уведомления
	    const toast = document.createElement('div');
	    toast.className = 'copy-notification';
	    toast.innerText = message;
	    document.body.appendChild(toast);
	
	    // Показываем с небольшой задержкой для анимации
	    setTimeout(() => toast.classList.add('show'), 100);
	
	    // Убираем через 2.5 секунды
	    setTimeout(() => {
	        toast.classList.remove('show');
	        setTimeout(() => toast.remove(), 300); // Удаляем из DOM после скрытия
	    }, 2500);
	}
});