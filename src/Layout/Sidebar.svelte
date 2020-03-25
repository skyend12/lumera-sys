<script>
	import Navbar from './Navbar.svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { Router, Link, Route } from "svelte-routing";
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let container_margin = 0;
	let sidebar_visible = 0;
	let navbar_margin = 250;
	let masterdatachild_visible = false;
	
	function toggleSidebar(){
		if(sidebar_visible == 0){
      navbar_margin    = 0;
      container_margin = 0;
      dispatch('message', {
          text: container_margin
      });
      setTimeout(() => {
        sidebar_visible  = -250;
      },100);
		}
		else{
			sidebar_visible = 0;
      setTimeout(() => {
        container_margin = 250;
        navbar_margin = 250;
        dispatch('message', {
          text: container_margin
        });
      },100);
		}

	}
	

	function toggleNav(parameter){
		if(parameter=="masterdata"){
			if(masterdatachild_visible==true){
				masterdatachild_visible=false;
			}
			else{
				masterdatachild_visible=true;
			}
		}
	}
</script>

<style type="scss">

.sidebar-anim{
  transition:all 0.6s ease-out;

  .brand-text-1{
    font-size: 14px;
    color: #fff;
  }

  .brand-text-2{
    font-size: 12px;
    color: #fff;
  }
}

.user-panel{
  border-radius: 6px;
  background-color: #fff !important;
  color: #0d0d0d;
  .user-authorization-info{
    margin-left: 12px;
  }

  .user-authorization-name{
    font-size: 13px;  
  }
  .user-authorization-status{
    font-size: 16px;
    font-weight: bold;
    margin-top: -3px;
  }
}

</style>

<!-- Main Sidebar Container -->
  <aside class="main-sidebar bg-primary elevation-4 sidebar-anim" style="position: fixed;height: 100vh;transform: translateX({sidebar_visible}px);">
    <div class="text-white" style="margin:7px;"> 

    <!-- Brand Logo -->
    <a href="#" class="brand-link">
      <div class="row w-100">
        <div class="col-4">
          <img src="./assets/img/logo.png" alt="Lumera Logo" style="width: 80px;height: 80px;">
        </div>
        <div class="col-6 mt-3 ml-2">
          <p class="brand-text-1 mb-1 font-weight-light">LumeraSys</p>
          <p class="brand-text-2 mt-0 font-weight-bold">Versi 1.0 rilis 2020</p>
        </div>
      </div>
    </a>

    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Sidebar user panel (optional) -->
      <div class="user-panel mt-1 ml-0 d-flex elevation-2 pt-3 pl-3 pb-1">
          <!-- user profile image -->
          <a href="javascript:;" class="avatar rounded-circle">
              <img alt="Image placeholder" src="./assets/img/profile_picture/avatar_1.jpg">
          </a>
          <div class="user-authorization-info">
            <p class="user-authorization-name m-0 mb-1">Ko Mi Ran</p>
            <p class="user-authorization-status">Administrator</p>
          </div>
      </div>
      <hr class="mt-3 mb-3" />
      <!-- Sidebar Menu -->
      <nav class="mt-2">
        <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
          <li class="nav-item has-treeview menu-open">
            <Link to = "dashboard">
            <span class="nav-link active">
              <i class="nav-icon fas fa-tachometer-alt"></i>
              <p>
                Dashboard
              </p>
          </span>
        	</Link>
          </li>
          <li class="nav-item has-treeview" on:click={()=>toggleNav("masterdata")}>
            <a href="#" class="nav-link">
              <i class="nav-icon fas fa-database"></i>
              <p>
                Master Data
                <i class="fas fa-angle-left right"></i>
              </p>
            </a>

            {#if masterdatachild_visible}

            <ul class="nav" transition:slide="{{ y: 100, duration: 300 }}">
              <li class="nav-item">
              	<Link to = "pengguna">
              		<span class="nav-link">
                  		<i class="far fa-user nav-icon"></i>
                  		<p>Pengguna</p>
              		</span>
              	</Link>
              </li>
              <li class="nav-item">
                <a href="pages/layout/top-nav-sidebar.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Produk</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="pages/layout/top-nav-sidebar.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Beautician</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="pages/layout/top-nav-sidebar.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Beautician</p>
                </a>
              </li>
            </ul>

            {/if}

          </li>
          <li class="nav-item has-treeview">
            <a href="#" class="nav-link">
              <i class="nav-icon fas fa-cart-plus"></i>
              <p>
                Pembelian
                <i class="right fas fa-angle-left"></i>
              </p>
            </a>
            <ul class="nav nav-treeview">
              <li class="nav-item">
                <a href="pages/charts/chartjs.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Produk Kecantikan</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="pages/charts/flot.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Jasa</p>
                </a>
              </li>
            </ul>
          </li>
          <li class="nav-item has-treeview">
            <a href="#" class="nav-link">
              <i class="nav-icon fas fa-fax"></i>
              <p>
                Penjualan
                <i class="right fas fa-angle-left"></i>
              </p>
            </a>
            <ul class="nav nav-treeview">
              <li class="nav-item">
                <a href="pages/charts/chartjs.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Produk Kecantikan</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="pages/charts/flot.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Jasa</p>
                </a>
              </li>
            </ul>
          </li>
          <li class="nav-item has-treeview">
            <a href="#" class="nav-link">
              <i class="nav-icon fas fa-print"></i>
              <p>
                Laporan
                <i class="fas fa-angle-left right"></i>
              </p>
            </a>
            <ul class="nav nav-treeview">
              <li class="nav-item">
                <a href="pages/UI/general.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>General</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="pages/UI/icons.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Icons</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="pages/UI/buttons.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Buttons</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="pages/UI/sliders.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Sliders</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="pages/UI/modals.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Modals & Alerts</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="pages/UI/navbar.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Navbar & Tabs</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="pages/UI/timeline.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Timeline</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="pages/UI/ribbons.html" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Ribbons</p>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      <!-- /.sidebar-menu -->
    </div>
    <!-- /.sidebar -->
  </div>
</aside>

<!-- Navbar -->
  <nav class="main-header navbar navbar-expand" style="margin-left:{navbar_margin}px;transition:all 0.5s linear;padding: 0px 0px 18px 0px ;height:auto;background-color: #fff;">
    <!-- Left navbar links -->
    <ul class="navbar-nav">
      <li class="nav-item" style="cursor: pointer;">
        <a class="nav-link text-primary" on:click={toggleSidebar} role="button"><i class="fas fa-bars"></i></a>
      </li>
    </ul>
    <!-- Right navbar links -->
    <ul class="navbar-nav ml-auto">
      <li class="nav-item">
        <a class="nav-link" data-widget="control-sidebar" data-slide="true" href="#" role="button"><i
            class="fas fa-cogs"></i></a>
      </li>
    </ul>
  </nav>
  <!-- /.navbar -->




