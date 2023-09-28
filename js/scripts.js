/*!
* Start Bootstrap - Agency v7.0.11 (https://startbootstrap.com/theme/agency)
* Copyright 2013-2022 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-agency/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    ObtenerData.publicaciones();

    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }

    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

});

var ObtenerData = {
    publicaciones: () => {
        const url = 'https://web-personal-wicho.000webhostapp.com/api/publicaciones/consulta.php';
        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error('La solicitud no fue exitosa');
            }
            return response.json();
          })
          .then(data => {
            // Procesar los datos de respuesta
            console.log(data);


              const contenedor = document.getElementById('cont_elemens');

            let i =0;
                for (const dato of data) {
                   i ++;

                        const nuevoDiv = document.createElement('div');
                        nuevoDiv.classList.add('col-lg-4', 'col-sm-6', 'mb-4', 'mb-lg-0');
                        
                        
                        const portfolioItem = document.createElement('div');
                        portfolioItem.classList.add('portfolio-item');
                        
                        const enlace = document.createElement('a');
                        enlace.classList.add('portfolio-link');
                        enlace.setAttribute('data-bs-toggle', 'modal');
                        enlace.href = '#portfolioModal'+i;
                        
                        
                        const portfolioHover = document.createElement('div');
                        portfolioHover.classList.add('portfolio-hover');
                        
                        
                        const portfolioHoverContent = document.createElement('div');
                        portfolioHoverContent.classList.add('portfolio-hover-content');
                        
                        
                        const icono = document.createElement('i');
                        icono.classList.add('fas', 'fa-plus', 'fa-3x');
                        
                        portfolioHoverContent.appendChild(icono);
                        portfolioHover.appendChild(portfolioHoverContent);
                        
                        
                        const imagen = document.createElement('img');
                        imagen.classList.add('img-fluid');
                        imagen.src = 'https://web-personal-wicho.000webhostapp.com/api/resourses/get_image.php?t='+dato.t+'&&n='+dato.n;
                        imagen.alt = '...';
                        
                        
                        enlace.appendChild(portfolioHover);
                        enlace.appendChild(imagen);
                        portfolioItem.appendChild(enlace);
                        
                        const portfolioCaption = document.createElement('div');
                        portfolioCaption.classList.add('portfolio-caption');
                        
                        const titulo = document.createElement('div');
                        titulo.classList.add('portfolio-caption-heading');
                        titulo.textContent = dato.encabezado;
                        
                        
                        const subtitulo = document.createElement('div');
                        subtitulo.classList.add('portfolio-caption-subheading', 'text-muted');
                        subtitulo.textContent = dato.subtitle;
                        
                        portfolioCaption.appendChild(titulo);
                        portfolioCaption.appendChild(subtitulo);
                        portfolioItem.appendChild(portfolioCaption);
                        nuevoDiv.appendChild(portfolioItem);
                        document.body.appendChild(nuevoDiv);

                    
                    
                    cont_elemens.appendChild(nuevoDiv);





                                            // Crear el elemento div con la clase y el id especificados
                        var divPortfolioModal = document.createElement('div');
                        divPortfolioModal.classList.add('portfolio-modal', 'modal', 'fade');
                        divPortfolioModal.id = 'portfolioModal'+i;
                        
                        // Crear la estructura interna del modal
                        divPortfolioModal.innerHTML = `
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="close-modal" data-bs-dismiss="modal"><img src="assets/img/close-icon.svg" alt="Close modal" /></div>
                                    <div class="container">
                                        <div class="row justify-content-center">
                                            <div class="col-lg-12">
                                                <div class="modal-body">
                                                    <!-- Project details-->
                                                    <div class="container">
                                                        <div class="row">
                                                            <div class="col-lg-6">
                                                                <img class="img-fluid d-block mx-auto" src="assets/img/portfolio/dia_de_muertos.png" alt="..." />
                                                            </div>
                                                            <div class="col-lg-6">
                                                                <h2 class="text-uppercase">`+ dato.encabezado+`</h2>
                                                                <p>Proyecto realizado para la clase de multimedia, desarrollado con las herramientas de paquetería de adobe (Photoshop, Animate, AfterEffects ).</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ul class="list-inline">
                                                        <li>
                                                            <strong>Categoría:</strong>
                                                            Animación
                                                        </li>
                                                    </ul>
                                                    <button class="btn btn-primary btn-xl text-uppercase" data-bs-dismiss="modal" type="button">
                                                        <i class="fas fa-xmark me-1"></i>
                                                        Cerrar Proyecto
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                        </div>
                        `;
                        
                        // Agregar el elemento al body del documento
                        document.body.appendChild(divPortfolioModal);

                    

                    
                  }
              
          })
          .catch(error => {
            console.error('Error al obtener los datos:', error);
          });
    },


}
