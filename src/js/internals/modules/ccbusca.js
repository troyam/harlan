var CPF = require("cpf_cnpj").CPF;
var CNPJ = require("cpf_cnpj").CNPJ;

module.exports = (controller) => {

    controller.registerCall("ccbusca::enable", () => {
        controller.registerTrigger("mainSearch::submit", "ccbusca", (val, cb) => {
            cb();
            if (!CNPJ.isValid(val) && !CPF.isValid(val)) {
                return;
            }
            controller.call("credits::has", 150, () => {
                controller.call("ccbusca", val);
            });
        });
    });

    controller.registerCall("ccbusca", function(val, callback) {
        controller.serverCommunication.call("SELECT FROM 'CCBUSCA'.'BILLING'",
        controller.call("error::ajax", controller.call("loader::ajax", {
            data: {
                documento: val
            },
            success: function(ret) {
                controller.call("ccbusca::parse", ret, val, callback);
            }
        })));
    });

    controller.registerCall("ccbusca::parse", function(ret, val, callback) {
        var sectionDocumentGroup = controller.call("section", "Busca Consolidada",
        "Informações agregadas do CPF ou CNPJ",
        "Registro encontrado");

        if (!callback) {
            $(".app-content").prepend(sectionDocumentGroup[0]);
        } else {
            callback(sectionDocumentGroup[0]);
        }

        controller.call("tooltip", sectionDocumentGroup[2], "Imprimir").append($("<i />").addClass("fa fa-print")).click((e) => {
            e.preventDefault();
            var html = sectionDocumentGroup[0].html(),
                printWindow = window.open("about:blank", "", "_blank");
            if (!printWindow) return;
            printWindow.document.write(html);
            printWindow.focus();
            printWindow.print();
        });

        var juntaEmpresaHTML = controller.call("xmlDocument", ret, "CCBUSCA", "CONSULTA");
        juntaEmpresaHTML.find(".container").first().addClass("xml2html")
            .data("document", $(ret))
            .data("form", [{
                name: "documento",
                value: val
            }]);

        sectionDocumentGroup[1].append(juntaEmpresaHTML);

        controller.serverCommunication.call("SELECT FROM 'SEEKLOC'.'CCF'", {
            data: {
                documento: val
            },
            success: (ret) => {
                let totalRegistro = parseInt($(ret).find("BPQL > body > data > resposta > totalRegistro").text());
                if (!totalRegistro) return;
                sectionDocumentGroup[1].append(controller.call("xmlDocument", ret));
            }
        });

        controller.serverCommunication.call("SELECT FROM 'IEPTB'.'CONSULTA'", {
            data: {
                documento: val
            },
            success: (ret) => {
                let totalProtestos = parseInt($(ret).find("BPQL > body > total").text());
                if (!totalProtestos) return;
                sectionDocumentGroup[1].append(controller.call("xmlDocument", ret));
            }
        });
    });
};
