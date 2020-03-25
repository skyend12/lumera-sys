<script>
	//import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
	import '../node_modules/argon-design-system-free/assets/css/argon.min.css';
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

	.content-wrapper{
		padding-bottom: 200px;
		padding-top: 20px;
	}

	footer{
		font-size: 13px;
	}

</style>
	
<Router>
	<Sidebar on:message={handleMessage}/>

  	<div class="content-wrapper" style="margin-left: {containerMarginVisibletoSidebar}px">
  		<Route path="dashboard" component="{Dashboard}" />
    	<Route path="pengguna" component="{Pengguna}" />
    	<Route path="tambahpengguna" component="{TambahPengguna}" />
    </div>
    
    <!-- /.content-wrapper -->
  	<footer class="main-footer" style="margin-left: {containerMarginVisibletoSidebar}px;">
    	<div class="float-right d-none d-sm-block">
      		<b>Version</b> 1.0
    	</div>
    	<strong>Copyright &copy; 2020 <a href="#">Lumera System</a>.</strong> All rights reserved.
  	</footer>
</Router>
	







			
		