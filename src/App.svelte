<script>
	import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
	import Sidebar from './layout/Sidebar.svelte';
	import Pengguna from './Pages/Pengguna.svelte';
	import TambahPengguna from './Pages/TambahPengguna.svelte';
	import Dashboard from './Pages/Dashboard.svelte';
	import { Router, Link, Route } from "svelte-routing";

	let containerMarginVisibletoSidebar = 250;

	function handleMessage(event) {
		containerMarginVisibletoSidebar = event.detail.text;
	}

</script>

<style type="text/css">

</style>
	
	<Router>
		<Sidebar on:message={handleMessage}/>
  		<div class="content-wrapper" style="margin-left: {containerMarginVisibletoSidebar}px">
  			{containerMarginVisibletoSidebar}
  			<Route path="dashboard" component="{Dashboard}" />
    		<Route path="pengguna" component="{Pengguna}" />
    		<Route path="tambahpengguna" component="{TambahPengguna}" />
    	</div>
	</Router>
	







			
		