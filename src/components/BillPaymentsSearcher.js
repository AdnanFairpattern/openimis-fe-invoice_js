import React, { useRef, useEffect, useState } from "react";
import { injectIntl } from "react-intl";
import {
  formatMessage,
  formatMessageWithValues,
  Searcher,
  formatDateFromISO,
  withModulesManager,
  coreConfirm,
} from "@openimis/fe-core";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { fetchPaymentInvoices, deletePaymentInvoice } from "../actions";
import {
  DEFAULT_PAGE_SIZE,
  EMPTY_STRING,
  RIGHT_BILL_PAYMENT_DELETE,
  ROWS_PER_PAGE_OPTIONS,
} from "../constants";
import BillPaymentsFilter from "./BillPaymentsFilter";
import PaymentInvoiceStatusPicker from "../pickers/PaymentInvoiceStatusPicker"
import DeleteIcon from "@material-ui/icons/Delete";
import { IconButton, Tooltip } from "@material-ui/core";
import { ACTION_TYPE } from "../reducer";

const BillPaymentsSearcher = ({
  intl,
  modulesManager,
  rights,
  bill,
  setConfirmedAction,
  deletePaymentInvoice,
  submittingMutation,
  mutation,
  coreConfirm,
  confirmed,
  fetchPaymentInvoices,
  fetchingPaymentInvoices,
  fetchedPaymentInvoices,
  errorPaymentInvoices,
  paymentInvoices,
  paymentInvoicesPageInfo,
  paymentInvoicesTotalCount,
}) => {
  const [queryParams, setQueryParams] = useState([]);
  const [paymentInvoiceToDelete, setPaymentInvoiceToDelete] = useState(null);
  const [deletedPaymentInvoiceUuids, setDeletedPaymentInvoiceUuids] = useState([]);
  const prevSubmittingMutationRef = useRef();

  useEffect(() => paymentInvoiceToDelete && openDeletePaymentInvoiceConfirmDialog(), [paymentInvoiceToDelete]);

  useEffect(() => {
    if (paymentInvoiceToDelete && confirmed) {
      setDeletedPaymentInvoiceUuids([...deletedPaymentInvoiceUuids, paymentInvoiceToDelete.id]);
    }
    paymentInvoiceToDelete && confirmed !== null && setPaymentInvoiceToDelete(null);
  }, [confirmed]);

  useEffect(() => {
    if (
      prevSubmittingMutationRef.current &&
      !submittingMutation &&
      [ACTION_TYPE.CREATE_PAYMENT_INVOICE_WITH_DETAIL, ACTION_TYPE.UPDATE_BILL_PAYMENT].includes(mutation?.actionType)
    ) {
      refetch();
    }
  }, [submittingMutation]);
  
  useEffect(() => {
    prevSubmittingMutationRef.current = submittingMutation;
  });

  const deletePaymentInvoiceCallback = () =>
    deletePaymentInvoice(
      paymentInvoiceToDelete,
      formatMessageWithValues(intl, "invoice", "paymentInvoice.delete.mutationLabel", {
        paymentInvoiceLabel: paymentInvoiceToDelete?.label,
        code: bill?.code,
      }),
    );

  const openDeletePaymentInvoiceConfirmDialog = () => {
    setConfirmedAction(() => deletePaymentInvoiceCallback);
    coreConfirm(
      formatMessageWithValues(intl, "invoice", "paymentInvoice.delete.confirm.title", {
        paymentInvoiceLabel: paymentInvoiceToDelete?.label,
      }),
      formatMessage(intl, "invoice", "paymentInvoice.delete.confirm.message"),
    );
  };

  const onDelete = (paymentInvoice) => setPaymentInvoiceToDelete(paymentInvoice);

  const fetch = (params) => fetchPaymentInvoices(params);

  const refetch = () => fetch(queryParams);

  const filtersToQueryParams = ({ filters, pageSize, beforeCursor, afterCursor, orderBy }) => {
    const queryParams = Object.keys(filters)
      .filter((f) => !!filters[f]["filter"])
      .map((f) => filters[f]["filter"]);
    pageSize && queryParams.push(`first: ${pageSize}`);
    beforeCursor && queryParams.push(`before: "${beforeCursor}"`);
    afterCursor && queryParams.push(`after: "${afterCursor}"`);
    orderBy && queryParams.push(`orderBy: ["${orderBy}"]`);
    setQueryParams(queryParams);
    return queryParams;
  };

  const headers = () => [
    "paymentInvoice.reconciliationStatus.label",
    "paymentInvoice.codeExt",
    "paymentInvoice.label",
    "paymentInvoice.codeTp",
    "paymentInvoice.codeReceipt",
    "paymentInvoice.fees",
    "paymentInvoice.amountReceived",
    "paymentInvoice.datePayment",
    "paymentInvoice.paymentOrigin",
    "paymentInvoice.payerRef",
  ];

  const itemFormatters = () => {
    const formatters = [
      (paymentInvoice) => <PaymentInvoiceStatusPicker value={paymentInvoice?.reconciliationStatus} readOnly />,
      (paymentInvoice) => paymentInvoice.codeExt,
      (paymentInvoice) => paymentInvoice.label,
      (paymentInvoice) => paymentInvoice.codeTp,
      (paymentInvoice) => paymentInvoice.codeReceipt,
      (paymentInvoice) => paymentInvoice.fees,
      (paymentInvoice) => paymentInvoice.amountReceived,
      (paymentInvoice) =>
        !!paymentInvoice.datePayment
          ? formatDateFromISO(modulesManager, intl, paymentInvoice.datePayment)
          : EMPTY_STRING,
      (paymentInvoice) => paymentInvoice.paymentOrigin,
      (paymentInvoice) => paymentInvoice.payerRef,
    ];

    if (rights.includes(RIGHT_BILL_PAYMENT_DELETE)) {
      formatters.push((paymentInvoice) => (
        <Tooltip title={formatMessage(intl, "invoice", "deleteButtonTooltip")}>
          <IconButton
            onClick={() => onDelete(paymentInvoice)}
            disabled={deletedPaymentInvoiceUuids.includes(paymentInvoice.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ));
    }
    return formatters;
  };

  const sorts = () => [
    ["reconciliationStatus", true],
    ["codeExt", true],
    ["label", true],
    ["codeTp", true],
    ["codeReceipt", true],
    ["fees", true],
    ["amountReceived", true],
    ["datePayment", true],
    ["paymentOrigin", true],
    ["payerRef", true],
  ];

  const defaultFilters = () => ({
    subjectIds: {
      value: bill?.id,
      filter: `subjectIds: ["${bill?.id}"]`,
    },
    isDeleted: {
      value: false,
      filter: "isDeleted: false",
    },
  });

  const isRowDisabled = (_, paymentInvoice) => deletedPaymentInvoiceUuids.includes(paymentInvoice.id);

  return (
    !!bill?.id && (
      <Searcher
        module="bill"
        FilterPane={BillPaymentsFilter}
        fetch={fetch}
        items={paymentInvoices}
        itemsPageInfo={paymentInvoicesPageInfo}
        fetchingItems={fetchingPaymentInvoices}
        fetchedItems={fetchedPaymentInvoices}
        errorItems={errorPaymentInvoices}
        tableTitle={formatMessageWithValues(intl, "invoice", "paymentInvoices.searcherResultsTitle", {
          paymentInvoicesTotalCount,
        })}
        filtersToQueryParams={filtersToQueryParams}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        defaultPageSize={DEFAULT_PAGE_SIZE}
        defaultOrderBy="codeExt"
        defaultFilters={defaultFilters()}
        rowDisabled={isRowDisabled}
        rowLocked={isRowDisabled}
      />
    )
  );
};

const mapStateToProps = (state) => ({
  fetchingPaymentInvoices: state.invoice.fetchingPaymentInvoices,
  fetchedPaymentInvoices: state.invoice.fetchedPaymentInvoices,
  errorPaymentInvoices: state.invoice.errorPaymentInvoices,
  paymentInvoices: state.invoice.paymentInvoices,
  paymentInvoicesPageInfo: state.invoice.paymentInvoicesPageInfo,
  paymentInvoicesTotalCount: state.invoice.paymentInvoicesTotalCount,
  submittingMutation: state.invoice.submittingMutation,
  mutation: state.invoice.mutation,
  confirmed: state.core.confirmed,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetchPaymentInvoices,
      deletePaymentInvoice,
      coreConfirm
    },
    dispatch,
  );
};

export default withModulesManager(injectIntl(connect(mapStateToProps, mapDispatchToProps)(BillPaymentsSearcher)));
