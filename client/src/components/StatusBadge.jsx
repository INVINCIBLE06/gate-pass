import React from 'react';

const LABELS = {
  in_checking: 'In Checking',
  unloading_started: 'Unloading',
  unloading_over: 'Unloaded',
  checked_out: 'Checked Out',
  pending_qc: 'Pending QC',
  quarantine: 'Quarantine',
  grn: 'GRN',
  posted: 'Posted',
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{LABELS[status] || status}</span>;
}
