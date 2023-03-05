import React from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { DoubleArrow } from "@material-ui/icons";
import { formatMessage, MainMenuContribution, withModulesManager } from "@openimis/fe-core";
import { LEGAL_AND_FINANCE_MAIN_MENU_CONTRIBUTION_KEY } from "../constants";
import { withStyles } from "@material-ui/core/styles";
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import PaymentsIcon from '@mui/icons-material/Payments';
const DoubleArrowFlipped = withStyles({
  root: {
    transform: "scaleX(-1)",
  },
})(DoubleArrow);


const LegalAndFinanceMainMenu = (props) => {
  const entries = [
    {
      text: formatMessage(props.intl, "invoice", "menu.invoices"),
      icon: <ReceiptLongIcon />,
      route: "/invoices",
    },
    {
      text: formatMessage(props.intl, "invoice", "menu.bills"),
      icon: <RequestQuoteIcon />,
      route: "/bills",
    },
  ];
  entries.push(
    ...props.modulesManager
      .getContribs(LEGAL_AND_FINANCE_MAIN_MENU_CONTRIBUTION_KEY)
      .filter((c) => !c.filter || c.filter(props.rights)),
  );

  return (
    <MainMenuContribution {...props} header={formatMessage(props.intl, "invoice", "mainMenu")} entries={entries} 
    
    icon={<PaymentsIcon />}
    
    />
  );
};

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

export default injectIntl(withModulesManager(connect(mapStateToProps)(LegalAndFinanceMainMenu)));
