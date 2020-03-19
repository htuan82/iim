//------------------------------------------------------------------------------
//| Class    x                                                                 |
//------------------------------------------------------------------------------
console.log("lib-1.0.js loaded");
class aiPaypal extends AI200 {
    constructor(name, setting) {
        super("aiPaypal_"+name);

        this.user = setting.user;
        this.pass = setting.pass;
    }

    learning(ai) {
        //--- ACTION
        ai.learn("dispute a transaction", {
            require_environment: { "logged": {}, },
            require: {
                transaction: {}
            },
            task: {
                "step 1": (task, input, data, action, ai) => {
                    // return;
                    return new $$()
        				.LoadUrl( input.transaction.url )
                        .wait(function(){
        					return window.location.href.indexOf("resolutioncenter/disputeOptions") > 0
                                && $("span[data-reason-code=BILLING]:visible").length
        				})
                        .Try(3, x => Helper.safe_click(`span[data-reason-code=BILLING]:visible`, `span[data-reason-code=CANCELED_RECURRING_BILLING]`))
                        .Try(3, x => Helper.safe_click(`span[data-reason-code=CANCELED_RECURRING_BILLING]`, `button#fileSubscription:contains('Continue')`))
                        .Try(3, x => Helper.safe_click(`button#fileSubscription:contains('Continue')`, `[name=expectedRefundAmount]`))
                        //--- Tell more ---//
                        .wait(`[name=expectedRefundAmount]`,1)
        				.go()
                },
                "step 2": (task, input, data, action, ai) => {
                    // return;
                    data.month = null; switch ($(".td-month").text().trim().toLowerCase()) {
                        case 'jan': data.month = '01'; data.month_text = 'january'; break;
                        case 'feb': data.month = '02'; data.month_text = 'february'; break;
                        case 'mar': data.month = '03'; data.month_text = 'march'; break;
                        case 'apr': data.month = '04'; data.month_text = 'april'; break;
                        case 'may': data.month = '05'; data.month_text = 'may'; break;
                        case 'jun': data.month = '06'; data.month_text = 'june'; break;
                        case 'jul': data.month = '07'; data.month_text = 'july'; break;
                        case 'aug': data.month = '08'; data.month_text = 'august'; break;
                        case 'sep': data.month = '09'; data.month_text = 'september'; break;
                        case 'oct': data.month = '10'; data.month_text = 'october'; break;
                        case 'nov': data.month = '11'; data.month_text = 'november'; break;
                        case 'dec': data.month = '12'; data.month_text = 'december'; break;
                    }

                    data.day = $(".td-day").text().trim();

                    data.year = new Date().getYear().toString().substr(-2);

                    data.date = [data.month, data.day, data.year].join("/")

                    return new $$()
        				.eClick("#merchantContacted_0")
                        .Try(3, x => Helper.safe_fill(`[name=expectedRefundAmount]`, input.transaction.amount))
                        .Try(3, x => Helper.safe_fill(`[name=cancellationNumber]`, input.transaction.id))

                        .Try(1, x => new $$()
                            .Try(3, x => Helper.safe_click(`#filters-Date`, `.date-picker-wrapper[style*='visibility: visible']`), 1)
                            .Try(12, x => {
                                var current_month = $(".month-name.nemo_datepickerMonthHeader").text().trim().toLowerCase().split(" ")[0];
                                if (current_month != data.month_text) {
                                    new $$()
                                        .eClick(`.prev.nemo_datepickerPreviousMonth`)
                                        .go()
                                    return false;
                                } else {
                                    return true;
                                }
                            })
                            .Try(3, x => Helper.safe_click(`div.day[data-day="${data.day*1}"]`, x => $("#filters-Date").val() == data.date), 1)
                            .wait(x => $("#filters-Date").val() == data.date)
                            .go()
                        )
                        .Try(3, x => Helper.safe_click("button#billingGenericContinue", "textarea#additionalInfo"), 3)
                        .wait("textarea#additionalInfo", 1)
        				.go()
                },
                "step 3": (task, input, data, action, ai) => {
                    data.desc = [];
                    data.desc.push(`Dear Paypal`);
                    data.desc.push(`I have unsubscribed but still have money deducted, please help me, thank you very much!`);
                    new $$()
                        .Try(3, x => Helper.safe_fill("textarea#additionalInfo", data.desc.join("\n")))
                        .Try(3, x => Helper.safe_click("button#billingGenericSubmit", `h1#thankYouHeader:contains('has been filed')`))
                        .wait("h1#thankYouHeader:contains('has been filed')", 1)
                        .go()
                },
            },
        })
        ai.learn("dispute transactions", {
            require_environment: { "transactions": {}, },
            require: {
                max: {default: 1}
            },
            logic: {
                "list not_opened": {true: {
                    "dispute": {},
                }}
            },
            task: {
                "list not_opened": (task, input, data, action, ai) => {
                    data.transactions = [];

                    iimDisplay("Found " + $("li .linkedBlock:visible").length + " transactions !");

                    //--- Pre Open ---//
                    $("li .linkedBlock:visible").click();

                    new $$().delay(5).go();

                    // $("li .linkedBlock:visible").each(function() {
                    //     new $$()
                    //         .eClick( $(this) )
                    //         .delay(0.1)
                    //         .go()
                    // })


                    $("li .linkedBlock:visible").each(function() {
                        // console.log( $(this) );

                        var transaction = {}
                        transaction.id = `t.attr('data-href').split("/").last()`.safe(null, {t:$(this)});
                        transaction.url = "https://www.paypal.com/resolutioncenter/" + transaction.id;
                        transaction.amount = $(this).find(`span.netAmount`).text().replace("$","").trim();
                        transaction.detail_opened = $(`#transactionDetails-${transaction.id} .inlineTransactionDetails dl`).length > 0;

                        if ( transaction.detail_opened == false ) {
                            transaction.detail_opened = new $$()
                                .Try(3, x => Helper.safe_click(`.linkedBlock[data-href*=${transaction.id}]`, `#transactionDetails-${transaction.id} .inlineTransactionDetails`, 5))
                                .wait( `#transactionDetails-${transaction.id} .inlineTransactionDetails dl`, 2)
                                .go()
                        }

                        if ( $(`#transactionDetails-${transaction.id} .inlineTransactionDetails dl`).length ) {
                            transaction.opened = $(`#transactionDetails-${transaction.id} .inlineTransactionDetails:contains('There is an open dispute associated with this transaction.')`).length > 0;
                        }

                        console.log(transaction.amount, transaction.detail_opened);

                        data.transactions.push( transaction );
                    })

                    console.log("data.transactions", data.transactions);

                    data.not_opened = data.transactions
                        .filter(t => t.opened == false)

                    return data.not_opened.length > 0
                },
                "dispute": (task, input, data, action, ai) => {
                    data.not_opened
                        .filter((t, index) => index < input.max)
                        .each(transaction => {
                            console.log("DISPUTING ", JSON.stringify(transaction));

                            ai.do("dispute a transaction", {
                                transaction: transaction
                            });

                        })
                },
            },
        }) // active

        //--- ENVIRONMENT
        ai.learn("transactions", {
            require_environment: { "logged": {} },
            task: {
				"load": (task, input, data, action, ai) => {
                    return new $$()
        				.LoadUrl("https://www.paypal.com/myaccount/transactions")
                        .wait(function(){
        					return window.location.href.indexOf("https://www.paypal.com/myaccount/transactions") == 0
                                && $("span.transactionDescription:visible").length
                                && $("li .linkedBlock").length
        				})
        				.go()
				},
			},
		})

        ai.learn("logged", {
            logic: {
                "check logged status": {false: {
                    "login": {
                        true: "check logged status"
                    },
                }},
            },
            task: {
                "check logged status": (task, input, data, action, ai) => {
                    if (window.location.href.indexOf('paypal.com') < 0
                        || !$found("input#email")) {
                        new $$()
                            .LoadUrl('https://www.paypal.com/myaccount')
                            .delay(1)
                            .wait("li a.js_logout:visible, input#email")
                            .go()
                    }

                    if (window.location.href.indexOf('paypal.com') < 0) return false;
                    if ($found("input#email")) return false;
                    return true;
                },
                "login": (task, input, data, action, ai) => {
                    return new $$()
                        .Try(3, function() { return new $$()
                            .LoadUrl("https://www.paypal.com/signin")
                            .delay(1)
                            .wait("input#email, li a.link_logout:visible").go()
                        })
                        .jFill("input#email", "").delay(0.5)
                        .Try(3, x => Helper.safe_fill("input#email", ai.user))
                        .Try(3, x => Helper.safe_click("#btnNext", "input#password"))
                        .Try(3, x => Helper.safe_fill("input#password", ai.pass))
                        .Try(3, x => Helper.safe_click("#btnLogin", "li a.js_logout:visible, a:contains('Not now'):visible"), 10)
                        .wait("li a.js_logout:visible, a:contains('Not now'):visible")
                        .go()

                    return true;
                },
            },
        })
    }
}
