<script context="module">
	
	export function noScroll() {
	  	document.body.style.overflow = 'hidden';
		document.querySelector('html').scrollTop = window.scrollY;
	}

	export function enableScroll() {
	  	document.body.style.overflow = 'scrollY';
		document.querySelector('html').scrollTop = window.scrollY;
	}

</script>